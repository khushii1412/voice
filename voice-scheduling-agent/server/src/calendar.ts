import { google } from "googleapis";
import { DateTime } from "luxon";

export type CreateEventInput = {
    name: string;
    date: string;
    time: string;
    title?: string;
    timezone?: string;
};

function mustGetEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing env var: ${key}`);
    return v;
}

function resolveDateTimeISO(date: string, time: string, timezone: string): string {
    // Preferred format: YYYY-MM-DD + HH:mm
    const isoCandidate = `${date} ${time}`;
    let dt = DateTime.fromFormat(isoCandidate, "yyyy-MM-dd HH:mm", { zone: timezone });

    if (!dt.isValid) {
        // fallback: try more flexible parsing
        dt = DateTime.fromJSDate(new Date(`${date} ${time}`), { zone: timezone });
    }

    if (!dt.isValid) {
        throw new Error(`Could not parse date/time. Received date="${date}" time="${time}"`);
    }

    return dt.toISO();
}

export async function createEvent(input: CreateEventInput) {
    const timezone = input.timezone || process.env.TZ || "Asia/Kolkata";

    const startISO = resolveDateTimeISO(input.date, input.time, timezone);
    const start = DateTime.fromISO(startISO, { zone: timezone });
    const end = start.plus({ minutes: 30 });

    const clientId = mustGetEnv("GOOGLE_CLIENT_ID");
    const clientSecret = mustGetEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri = mustGetEnv("GOOGLE_REDIRECT_URI");
    const refreshToken = mustGetEnv("GOOGLE_REFRESH_TOKEN");
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const summary = input.title?.trim() ? input.title.trim() : `Meeting with ${input.name}`;

    const description = `Booked via Voice Scheduling Agent.\nName: ${input.name}`;

    const resp = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary,
            description,
            start: { dateTime: start.toISO(), timeZone: timezone },
            end: { dateTime: end.toISO(), timeZone: timezone }
        }
    });

    const ev = resp.data;

    return {
        eventId: ev.id || null,
        htmlLink: ev.htmlLink || null,
        summary: ev.summary || summary,
        start: start.toISO(),
        end: end.toISO(),
        timezone
    };
}
