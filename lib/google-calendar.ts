import { google } from "googleapis";

export async function createCalendarEvent({
  title,
  start,
  end,
  attendeeEmails,
  description,
}: {
  title: string;
  start: Date;
  end: Date;
  attendeeEmails: string[];
  description: string;
}) {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID!,
    sendUpdates: "all",
    requestBody: {
      summary: title,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone: "America/New_York",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "America/New_York",
      },
      attendees: attendeeEmails.map((email) => ({ email })),
      conferenceData: undefined,
    },
  });

  return event.data;
}
