import { Request, Response, Router } from "express";
import { createEvent } from "./calendar";

const router = Router();

router.post("/retell/tool", async (req: Request, res: Response) => {
    try {
        console.log(`[${new Date().toISOString()}] Incoming Retell Tool Call`);
        console.log("Headers:", JSON.stringify(req.headers, null, 2));
        console.log("Body:", JSON.stringify(req.body, null, 2));

        const body = req.body || {};

        // Accept multiple payload shapes:
        // A) { function/name/toolCall.name, arguments: {...} }
        // B) args-only: { name, date, time, title, timezone }
        let args =
            body?.arguments ||
            body?.args ||
            body?.toolCall?.arguments ||
            body?.tool_call?.arguments ||
            body; // args-only fallback

        // AI providers often send arguments as a JSON string
        if (typeof args === "string") {
            try {
                args = JSON.parse(args);
                console.log("Parsed string arguments:", JSON.stringify(args, null, 2));
            } catch (e) {
                console.error("Failed to parse arguments string:", args);
            }
        }

        console.log("Final Extracted Args:", JSON.stringify(args, null, 2));

        if (!args?.name || !args?.date || !args?.time) {
            console.warn("Validation failed: Missing name, date, or time in args. Possible keys found:", Object.keys(args || {}));
            return res.status(400).json({
                ok: false,
                error: { message: "Missing required fields (name, date, time)" }
            });
        }

        const result = await createEvent({
            name: String(args.name),
            date: String(args.date),
            time: String(args.time),
            phoneNumber: args.phone_number || args.phone || args.phoneNumber || body?.from_number || undefined,
            title: args.title ? String(args.title) : undefined,
            timezone: args.timezone ? String(args.timezone) : undefined
        });

        console.log("Calendar event created successfully.");

        // Return a response that many AI tool systems expect
        return res.json({
            ok: true,
            status: "success",
            message: "Event created successfully",
            result: `Successfully booked meeting for ${args.name} on ${args.date} at ${args.time}`,
            event: result
        });
    } catch (err: any) {
        console.error("Tool error:", err?.message || err);
        return res.status(500).json({
            ok: false,
            error: { message: err?.message || "Tool failed" }
        });
    }
});

export default router;