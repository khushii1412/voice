#  Jordan: The Voice Scheduling Assistant

Jordan is a real-time AI voice assistant that schedules Google Calendar appointments over a phone call. It is built using **Retell AI**, **Node.js**, **Express**, and the **Google Calendar API**.

Jordan acts as a professional Executive Assistant at **Khushi's Workspace**, initiating conversations to collect meeting details and confirming them before booking.

---

##  Technical Stack

- **Voice Engine:** [Retell AI](https://retellai.com) (Single Prompt Mode)
- **Backend:** Node.js + Express (TypeScript)
- **Deployment:** [Render](https://render.com) (Pinned to Node 18.x)
- **Calendar API:** Google Calendar (OAuth 2.0 with Offline Refresh Tokens)
- **Interactive Dashboard:** Built-in **Web Call** capability allowing voice interaction directly from the browser.
- **Date/Time Logic:** [Luxon](https://moment.github.io/luxon/) for timezone-aware scheduling

---

## Live Deployment

- **Main Dashboard (UI):** `https://voice-scheduling-agent-vu1d.onrender.com`
- **Backend API:** `https://voice-scheduling-agent-vu1d.onrender.com/retell/tool`
- **Root Directory (Render):** `voice-scheduling-agent/server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

---

## Repository Structure

```
voice-scheduling-agent/
└── server/               ← Express + TypeScript backend
    ├── src/
    │   ├── index.ts      ← Entry point & OAuth routes
    │   ├── retellWebhook.ts  ← POST /retell/tool handler
    │   ├── oauth.ts      ← Google OAuth 2.0 logic
    │   └── calendar.ts   ← Google Calendar integration
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

---

##  The "Jordan" Prompt

Jordan uses a specific persona to handle calls professionally. To ensure relative dates (like "tomorrow") work correctly, the prompt includes the current date as context.

### Prompt Instructions (Copy & Paste):
```text
## Persona
You are "Jordan," a highly professional and proactive Executive Assistant at Khushi's Workspace. Your goal is to provide a seamless, premium scheduling experience for the caller.

## Context
- Today's Date: Monday, February 23, 2026.

## Conversation Flow
1. Greet the user: "Hello! I'm Jordan, your scheduling assistant. May I start with your name?"
2. Ask for the Date and Time.
3. Ask for an optional Meeting Title.
4. Summarize: "I have you down for [Title] on [Date] at [Time]. Is that correct?"
5. Confirm and use the `create_calendar_event` tool.
```

---

## Retell Tool Configuration

Jordan uses a **Custom Function** to talk to the backend.

- **Name:** `create_calendar_event`
- **URL:** `https://voice-scheduling-agent-vu1d.onrender.com/retell/tool`
- **JSON Schema:**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "date": { "type": "string" },
    "time": { "type": "string" },
    "title": { "type": "string" }
  },
  "required": ["name", "date", "time"]
}
```

---

## Environment Variables

The following must be set in your hosted environment (e.g., Render):

| Key | Source |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | Google Cloud Dashboard |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Dashboard |
| `GOOGLE_REFRESH_TOKEN` | Generated via `/auth` redirect |
| `GOOGLE_REDIRECT_URI` | `.../oauth2callback` |
| `RETELL_API_KEY` | Retell AI Dashboard (API Keys) |
| `RETELL_AGENT_ID` | `agent_9bbda664892fff9658cd70850f` |
| `TZ` | `Asia/Kolkata` |

---

##  How to Test Jordan
1. **Open the Dashboard:** Visit `https://voice-scheduling-agent-vu1d.onrender.com`.
2. **Talk to Jordan:** Click the **"Talk to Jordan"** button.
3. **Grant Mic Permissions:** Enable your microphone when prompted.
4. **Schedule a Meeting:** 
   - Say: "Hi Jordan, I'm [Your Name]. Can you book a 30-minute sync tomorrow at 2 PM?"
   - Jordan will confirm the details.
   - Once confirmed, she will book it on the calendar.
5. **Verify:** Check your Google Calendar to see the event instantly created!

---

##  Calendar Integration
Jordan uses the **Google Calendar API** with a secure **OAuth 2.0** flow:
- **Offline Access:** The server uses an `offline` refresh token, meaning Jordan remains authorized to book meetings for you 24/7, even when you aren't logged in.
- **Intelligent Timezones:** All calls use `Luxon` to handle timezone conversions (default: `Asia/Kolkata`), ensuring "2 PM" is booked exactly when you expect.
- **Dynamic Context:** Every request sent to Jordan includes the current date, allowing her to understand relative terms like "next Monday" or "tomorrow."

---

##  Local Development (Optional)
If you want to run this project on your own machine:
1. **Clone the Repo:** `git clone <your-repo-url>`
2. **Install Dependencies:** 
   ```bash
   cd voice-scheduling-agent/server
   npm install
   ```
3. **Setup Environment:** Create a `.env` file based on `.env.example` and add your keys.
4. **Run in Dev Mode:**
   ```bash
   npm run dev
   ```
5. **Expose to Retell:** Use a tool like **ngrok** to point Retell's webhook to your local machine (`localhost:3000/retell/tool`).

---

##  Verification Proof
- **Live Status:** Verified via dashboard system check.
- **Calendar Success:** [Attach your Screenshot/Loom here!]
- **Backend Logs:** [Check your Render logs for the "Successfully generated access token" message.]
