import { NextRequest, NextResponse } from "next/server";
import { google, calendar_v3 } from "googleapis";
import { getSupabase } from "@/lib/supabase";

interface TeacherRow {
  id: string;
  slug: string | null;
  google_calendar_id: string | null;
}

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
  const supabase = getSupabase();

  // ── Fetch all teachers with a configured google_calendar_id ──────────────
  // Fall back to the env-var calendar (Sam's) for any teacher with slug='sam-a'
  // that has no google_calendar_id set yet (backward compatibility).
  const { data: teachers, error: teacherErr } = await supabase
    .from("teachers")
    .select("id, slug, google_calendar_id")
    .eq("storefront_published", true);

  if (teacherErr) {
    console.error("[sync-availability] Failed to fetch teachers:", teacherErr);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }

  // Build effective teacher list: use DB google_calendar_id if set;
  // fall back to env vars for Sam so we don't break the live deployment.
  const effectiveTeachers: Array<TeacherRow & { effectiveCalendarId: string }> = [];
  for (const t of teachers ?? []) {
    const calId = t.google_calendar_id ?? (t.slug === "sam-a" ? config.calendarId : null);
    if (!calId) continue;
    effectiveTeachers.push({ ...t, effectiveCalendarId: calId });
  }

  if (effectiveTeachers.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, checked: 0, teachers: 0 });
  }

  // Shared Google auth (service account — same credentials for all teachers for now)
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const gcal = google.calendar({ version: "v3", auth });

  let totalInserted = 0;
  let totalChecked = 0;

  for (const teacher of effectiveTeachers) {
    const inserted = await syncTeacher(teacher, teacher.effectiveCalendarId, gcal, supabase, config);
    totalInserted += inserted;
    totalChecked += config.lookaheadDays * (config.slotEndHour - config.slotStartHour);
    console.log(`[sync-availability] teacher=${teacher.slug} inserted=${inserted}`);
  }

  return NextResponse.json({
    ok: true,
    inserted: totalInserted,
    checked: totalChecked,
    teachers: effectiveTeachers.length,
  });
}

async function syncTeacher(
  teacher: TeacherRow,
  calendarId: string,
  gcal: calendar_v3.Calendar,
  supabase: ReturnType<typeof getSupabase>,
  config: ReturnType<typeof getConfig>
): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + config.lookaheadDays);

  // ── 1. Fetch Google Calendar events for this teacher ────────────────────
  let calEvents: calendar_v3.Schema$Event[] = [];
  try {
    const res = await gcal.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: windowEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    calEvents = res.data.items ?? [];
  } catch (err) {
    console.error(`[sync-availability] GCal fetch failed for teacher=${teacher.slug}:`, err);
    return 0; // non-fatal — skip this teacher, continue with others
  }

  const calIntervals = calEvents
    .map(timedInterval)
    .filter((e): e is { start: Date; end: Date } => e !== null);

  // ── 2. Fetch existing slots for this teacher ────────────────────────────
  const { data: existingSlots } = await supabase
    .from("availability")
    .select("datetime")
    .eq("teacher_id", teacher.id)
    .eq("offering_type", config.offeringType)
    .gte("datetime", now.toISOString())
    .lte("datetime", windowEnd.toISOString());

  const existingSlotISOs = new Set<string>(
    (existingSlots ?? []).map((s) => new Date(s.datetime).toISOString())
  );

  // ── 3. Count this teacher's bookings per day (daily cap) ────────────────
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("availability:availability_id(datetime)")
    .eq("teacher_id", teacher.id)
    .eq("offering_type", config.offeringType)
    .in("status", ["pending", "confirmed"]);

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

  // ── 4. Generate free slots ──────────────────────────────────────────────
  const slotsToInsert: { offering_type: string; datetime: string; is_booked: boolean; teacher_id: string }[] = [];

  for (let dayOffset = 0; dayOffset < config.lookaheadDays; dayOffset++) {
    const dayDate = new Date(now);
    dayDate.setUTCDate(dayDate.getUTCDate() + dayOffset);
    const dateStr = etDateStr(dayDate);

    if ((bookingsByDate[dateStr] ?? 0) >= config.maxDailyBookings) continue;

    for (let hour = config.slotStartHour; hour < config.slotEndHour; hour++) {
      const slotStart = makeETDate(dateStr, hour,     0);
      const slotEnd   = makeETDate(dateStr, hour + 1, 0);

      if (slotStart.getTime() <= now.getTime() + config.bufferMinutes * 60_000) continue;
      if (existingSlotISOs.has(slotStart.toISOString())) continue;

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
          teacher_id: teacher.id,
        });
        existingSlotISOs.add(slotStart.toISOString());
      }
    }
  }

  // ── 5. Insert ────────────────────────────────────────────────────────────
  if (slotsToInsert.length > 0) {
    const { error } = await supabase.from("availability").insert(slotsToInsert);
    if (error) {
      console.error(`[sync-availability] Insert failed for teacher=${teacher.slug}:`, error);
      return 0;
    }
  }

  return slotsToInsert.length;
}
