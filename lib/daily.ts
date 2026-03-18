// Daily.co REST API client — lazy singleton following lib/stripe.ts pattern.
//
// Requires env vars:
//   DAILY_API_KEY  — from dashboard.daily.co → Developers → API keys

const DAILY_BASE = "https://api.daily.co/v1";

function authHeader() {
  return { Authorization: `Bearer ${process.env.DAILY_API_KEY!}` };
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface DailyMeetingToken {
  token: string;
}

/**
 * Create a Daily.co room.
 * Room expires 24 hours after `scheduled_at` (or now if not provided).
 */
export async function createDailyRoom(
  name: string,
  scheduledAt?: Date
): Promise<DailyRoom> {
  const base = scheduledAt ?? new Date();
  const exp = Math.floor(base.getTime() / 1000) + 60 * 60 * 24; // +24h

  const res = await fetch(`${DAILY_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      name,
      properties: {
        exp,
        enable_screenshare: false,
        enable_chat: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Daily.co createRoom failed: ${err}`);
  }

  return res.json();
}

/**
 * Issue a meeting token for a specific room.
 * Teachers get is_owner:true (can end meeting for all).
 * Students get is_owner:false.
 */
export async function createMeetingToken(
  roomName: string,
  userName: string,
  isOwner: boolean,
  scheduledAt?: Date
): Promise<DailyMeetingToken> {
  const base = scheduledAt ?? new Date();
  const exp = Math.floor(base.getTime() / 1000) + 60 * 60 * 24; // +24h

  const res = await fetch(`${DAILY_BASE}/meeting-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Daily.co createMeetingToken failed: ${err}`);
  }

  return res.json();
}

/**
 * Delete a Daily.co room (e.g. when a session is cancelled).
 */
export async function deleteDailyRoom(name: string): Promise<void> {
  const res = await fetch(`${DAILY_BASE}/rooms/${name}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Daily.co deleteRoom failed: ${err}`);
  }
}
