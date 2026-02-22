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
        const args =
            body?.arguments ||
            body?.args ||
            body?.toolCall?.arguments ||
            body?.tool_call?.arguments ||
            body; // args-only fallback

        console.log("Extracted Args:", JSON.stringify(args, null, 2));

        if (!args?.name || !args?.date || !args?.time) {
            console.warn("Validation failed: Missing name, date, or time in args");
            return res.status(400).json({
                ok: false,
                error: { message: "Missing required fields (name, date, time)" }
            });
        }

        const result = await createEvent({
            name: String(args.name),
            date: String(args.date),
            time: String(args.time),
            phoneNumber: args.phone_number || args.phoneNumber || args.phone || undefined,
            title: args.title ? String(args.title) : undefined,
            timezone: args.timezone ? String(args.timezone) : undefined
        });

        console.log("Calendar event created:", result);

        return res.json({
            ok: true,
            message: "Event created successfully",
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