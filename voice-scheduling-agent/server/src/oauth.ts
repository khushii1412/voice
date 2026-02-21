import { google } from "googleapis";

function mustGetEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing env var: ${key}`);
    return v;
}

export function getOAuthClient() {
    const clientId = mustGetEnv("GOOGLE_CLIENT_ID");
    const clientSecret = mustGetEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri = mustGetEnv("GOOGLE_REDIRECT_URI");
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl() {
    const oauth2Client = getOAuthClient();

    // offline is required to get refresh_token
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/calendar.events"]
    });

    return url;
}

export async function exchangeCodeForTokens(code: string) {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}
