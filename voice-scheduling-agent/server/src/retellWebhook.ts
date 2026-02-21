import { Request, Response, Router } from "express";
import { createEvent } from "./calendar";

const router = Router();

router.post("/retell/tool", async (req: Request, res: Response) => {
    try {
        console.log("Retell webhook received:", JSON.stringify(req.body, null, 2));

        const body = req.body || {};

        // Accept multiple payload shapes:
        // A) { function/name/toolCall.name, arguments: {...} }
        // B) args-only: { name, date, time, title, timezone }
        const args =
            body?.arguments ||
            body?.args ||
            body?.toolCall?.arguments ||
            body; // args-only fallback

        if (!args?.name || !args?.date || !args?.time) {
            return res.status(400).json({
                ok: false,
                error: { message: "Missing required fields (name, date, time)" }
            });
        }

        const result = await createEvent({
            name: String(args.name),
            date: String(args.date),
            time: String(args.time),
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