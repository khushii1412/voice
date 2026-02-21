import { getAuthUrl, exchangeCodeForTokens } from "./oauth";
import retellRouter from "./retellWebhook";
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));

// basic request log (put BEFORE routes)
app.use((req: Request, _res: Response, next: NextFunction) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.get("/", (_req, res) => {
    res.send("Voice Scheduling Agent backend is running. Use /health or POST /retell/tool");
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

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});