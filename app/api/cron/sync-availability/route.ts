import { NextRequest, NextResponse } from "next/server";
import { google, calendar_v3 } from "googleapis";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Config ────────────────────────────────────────────────────────────────────
// All configurable via environment variables.

function getConfig() {
  const slotStartHour = parseInt(process.env.CRON_SLOT_START_HOUR ?? "10"); // 10am ET
  const slotEndHour   = parseInt(process.env.CRON_SLOT_END_HOUR   ?? "23"); // last slot starts 10pm ET
  const lookaheadDays = parseInt(process.env.CRON_LOOKAHEAD_DAYS  ?? "14");
  const maxDailyBookings = parseInt(process.env.CRON_MAX_DAILY_BOOKINGS ?? "3");
  const bufferMinutes    = parseInt(process.env.CRON_BUFFER_MINUTES     ?? "30");

  return {
    slotStartHour,
    slotEndHour,
    lookaheadDays,
    maxDailyBookings,
    bufferMinutes,
    offeringType: "consultation",
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
  };
}

// ── ET date helpers ───────────────────────────────────────────────────────────

// Returns "YYYY-MM-DD" for a UTC Date as seen in America/New_York.
function etDateStr(utcDate: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utcDate);
}

// Builds a UTC Date representing a specific wall-clock hour:minute in ET,
// correctly handling both EST (UTC-5) and EDT (UTC-4).
function makeETDate(dateStr: string, hour: number, minute = 0): Date {
  // Start with the EST assumption (UTC-5).
  const candidate = new Date(`${dateStr}T00:00:00.000Z`);
  candidate.setUTCHours(hour + 5, minute, 0, 0);

  // Verify by formatting back to ET; if the ET hour doesn't match, we're in EDT.
  const actualEtHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(candidate)
  );

  if (actualEtHour === hour) return candidate;

  // Retry with EDT offset (UTC-4).
  const edtCandidate = new Date(`${dateStr}T00:00:00.000Z`);
  edtCandidate.setUTCHours(hour + 4, minute, 0, 0);
  return edtCandidate;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

// Returns a timed interval for a GCal event, or null for all-day events.
function timedInterval(
  event: calendar_v3.Schema$Event
): { start: Date; end: Date } | null {
  if (!event.start?.dateTime || !event.end?.dateTime) return null;
  return {
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
  };
}

function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date }
): boolean {
  return a.start < b.end && a.end > b.start;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth: Vercel automatically sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  const now = new Date();

  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + config.lookaheadDays);

  // ── 1. Fetch Google Calendar events ────────────────────────────────────────

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const gcal = google.calendar({ version: "v3", auth });

  let calEvents: calendar_v3.Schema$Event[] = [];
  try {
    const res = await gcal.events.list({
      calendarId: config.calendarId,
      timeMin: now.toISOString(),
      timeMax: windowEnd.toISOString(),
      singleEvents: true, // expands recurring events
      orderBy: "startTime",
    });
    calEvents = res.data.items ?? [];
  } catch (err) {
    console.error("[sync-availability] Google Calendar fetch failed:", err);
    return NextResponse.json({ error: "Calendar fetch failed" }, { status: 500 });
  }

  // Build timed intervals only (skip all-day events like birthdays/reminders).
  const calIntervals = calEvents
    .map(timedInterval)
    .filter((e): e is { start: Date; end: Date } => e !== null);

  // ── 2. Fetch existing Supabase state ────────────────────────────────────────

  const supabase = getSupabase();

  // All existing availability slots in the window — to avoid duplicates.
  const { data: existingSlots } = await supabase
    .from("availability")
    .select("datetime")
    .eq("offering_type", config.offeringType)
    .gte("datetime", now.toISOString())
    .lte("datetime", windowEnd.toISOString());

  const existingSlotISOs = new Set<string>(
    (existingSlots ?? []).map((s) => new Date(s.datetime).toISOString())
  );

  // All pending/confirmed bookings in the window — to enforce daily booking cap.
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("availability:availability_id(datetime)")
    .eq("offering_type", config.offeringType)
    .in("status", ["pending", "confirmed"]);

  // Count bookings per ET calendar date.
  const bookingsByDate: Record<string, number> = {};
  for (const b of existingBookings ?? []) {
    const raw = b.availability as unknown;
    const avail: { datetime: string } | null = Array.isArray(raw)
      ? (raw[0] ?? null)
      : (raw as { datetime: string } | null);
    if (!avail?.datetime) continue;
    const d = etDateStr(new Date(avail.datetime));
    bookingsByDate[d] = (bookingsByDate[d] ?? 0) + 1;
  }

  // ── 3. Generate free slots ─────────────────────────────────────────────────

  const slotsToInsert: { offering_type: string; datetime: string; is_booked: boolean }[] = [];

  for (let dayOffset = 0; dayOffset < config.lookaheadDays; dayOffset++) {
    const dayDate = new Date(now);
    dayDate.setUTCDate(dayDate.getUTCDate() + dayOffset);
    const dateStr = etDateStr(dayDate);

    // Skip days at or over the daily booking cap.
    if ((bookingsByDate[dateStr] ?? 0) >= config.maxDailyBookings) continue;

    for (let hour = config.slotStartHour; hour < config.slotEndHour; hour++) {
      const slotStart = makeETDate(dateStr, hour,     0);
      const slotEnd   = makeETDate(dateStr, hour + 1, 0);

      // Skip anything that hasn't started at least 30 minutes from now.
      if (slotStart.getTime() <= now.getTime() + config.bufferMinutes * 60_000) continue;

      // Skip if this slot already exists in the availability table.
      if (existingSlotISOs.has(slotStart.toISOString())) continue;

      // The protected window: 30 min before slot start through 30 min after slot end.
      const bufferStart = new Date(slotStart.getTime() - config.bufferMinutes * 60_000);
      const bufferEnd   = new Date(slotEnd.getTime()   + config.bufferMinutes * 60_000);

      const blocked = calIntervals.some((ev) =>
        overlaps(ev, { start: bufferStart, end: bufferEnd })
      );

      if (!blocked) {
        slotsToInsert.push({
          offering_type: config.offeringType,
          datetime: slotStart.toISOString(),
          is_booked: false,
        });
        // Prevent duplicates within the same run.
        existingSlotISOs.add(slotStart.toISOString());
      }
    }
  }

  // ── 4. Insert ──────────────────────────────────────────────────────────────

  let inserted = 0;
  if (slotsToInsert.length > 0) {
    const { error } = await supabase.from("availability").insert(slotsToInsert);
    if (error) {
      console.error("[sync-availability] Supabase insert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    inserted = slotsToInsert.length;
  }

  const totalChecked = config.lookaheadDays * (config.slotEndHour - config.slotStartHour);

  console.log(
    `[sync-availability] Done. Inserted ${inserted} slots out of ${totalChecked} checked.`
  );

  return NextResponse.json({
    ok: true,
    inserted,
    checked: totalChecked,
    config: {
      slotStartHour: config.slotStartHour,
      slotEndHour:   config.slotEndHour,
      lookaheadDays: config.lookaheadDays,
      bufferMinutes: config.bufferMinutes,
      maxDailyBookings: config.maxDailyBookings,
    },
  });
}
