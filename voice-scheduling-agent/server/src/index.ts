import { getAuthUrl, exchangeCodeForTokens } from "./oauth";
import { createEvent, listUpcomingEvents } from "./calendar";
import retellRouter from "./retellWebhook";
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// basic request log (put BEFORE routes)
app.use((req: Request, _res: Response, next: NextFunction) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/auth", (_req: Request, res: Response) => {
    try {
        const url = getAuthUrl();
        res.redirect(url);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ ok: false, error: { message: err?.message || "Auth failed" } });
    }
});

app.get("/oauth2callback", async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || "");
        if (!code) {
            return res.status(400).json({ ok: false, error: { message: "Missing ?code=" } });
        }

        const tokens = await exchangeCodeForTokens(code);
        const refreshToken = tokens.refresh_token || "";

        console.log("OAuth tokens received:", tokens);
        console.log("REFRESH TOKEN (save this in .env as GOOGLE_REFRESH_TOKEN):", refreshToken);

        res.type("text/plain").send(
            [
                "OAuth complete.",
                "",
                "Copy this refresh token into your server/.env as GOOGLE_REFRESH_TOKEN:",
                refreshToken || "(No refresh_token returned. Remove app access and try again with prompt=consent.)",
                "",
                "You can close this tab."
            ].join("\n")
        );
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ ok: false, error: { message: err?.message || "Callback failed" } });
    }
});

// NEW: Create Web Call for Frontend Dashboard
app.post("/create-web-call", async (_req: Request, res: Response) => {
    try {
        const apiKey = process.env.RETELL_API_KEY;
        const agentId = process.env.RETELL_AGENT_ID || "agent_9bbda664892fff9658cd70850f";

        console.log(`[WebCall] Attempting to create call for agent: ${agentId}`);
        console.log(`[WebCall] API Key present: ${!!apiKey}`);

        if (!apiKey) {
            console.error("[WebCall] Error: RETELL_API_KEY is missing in environment.");
            return res.status(500).json({ ok: false, error: "RETELL_API_KEY not set in environment" });
        }

        const response = await fetch("https://api.retellai.com/v2/create-web-call", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ agent_id: agentId }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            const errorMsg = data?.message || "Retell API request failed";
            console.error("[WebCall] Retell API error:", data);
            return res.status(response.status).json({
                ok: false,
                error: errorMsg
            });
        }

        console.log("[WebCall] Successfully generated access token.");
        res.json(data);
    } catch (err: any) {
        console.error("[WebCall] Critical failure:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// NEW: Fetch Upcoming Events for Dashboard
app.get("/calendar-events", async (_req: Request, res: Response) => {
    try {
        const events = await listUpcomingEvents();
        res.json({ ok: true, events });
    } catch (err: any) {
        console.error("[Calendar] Failed to list events:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Mount retell routes AFTER middleware
app.use("/", retellRouter);

// 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: { message: "Not Found" } });
});

// error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ ok: false, error: { message: "Internal Server Error" } });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
});