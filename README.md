# GitPulse

AI-powered GitHub activity summaries for developers, teams, and agencies.

GitPulse watches your repos, turns commits and PRs into readable AI summaries, and can deliver them in-app, Slack, or Discord. It includes plans (Free / Pro / Agency), PDF export, team invites, and billing UI.

---

## What’s built so far

### Done — core product

| Area | What’s implemented |
|------|--------------------|
| **Auth** | GitHub OAuth login, session cookies (7 days), logout |
| **Repos** | Add/remove GitHub repos, auto-create/delete GitHub webhooks |
| **Summaries** | Push/PR-triggered AI summaries via BullMQ + OpenAI (runs in the API process) |
| **On-demand reports** | Daily / weekly / custom date-range reports |
| **Scheduled digests** | Daily & weekly cron digests (runs in the API process) |
| **Slack** | OAuth “Add to Slack” + test notification + auto-delivery |
| **Discord** | Webhook URL save + test + auto-delivery |
| **Analytics** | Commits, features, bugs, PRs, charts, feedback counts |
| **Webhook dashboard** | Delivery log, status, errors, retry |
| **Summary actions** | Thumbs up/down, archive/restore, delete, copy markdown |
| **Settings** | AI model, custom prompt, digest cadence/hour, integrations |
| **PDF export** | Download summary as PDF (Pro/Agency) |
| **White-label PDFs** | Agency branding (report title + footer) |
| **Team** | Invite by GitHub username, roles, seat limits (Agency) |
| **Plan gating** | Report / repo / seat limits; Slack/Discord & PDF locked on Free |
| **Billing UI** | Free / Pro ($19) / Agency ($49) page with upgrade flow |
| **Landing + login** | Marketing site, pricing section, GitHub login |

### Done — billing (Dodo Payments)

Checkout, customer portal, and webhooks sync `plan_tier` / subscription status via **Dodo Payments**.
Fill `DODO_*` keys in `server/.env` and point Dodo webhooks to `${SERVER_URL}/webhooks/dodo`.

### Done — deploy readiness

- CORS + production cookies prepared for split frontend/API (`CLIENT_URL`, `sameSite=none` in production)
- Client API calls use `VITE_API_URL` when set
- GitHub OAuth callback can use full `SERVER_URL` in production
- Single Node process (API + BullMQ worker + digest cron) — deploys as one Render free web service, no separate paid worker instance needed. See `render.yaml`.
- Frontend deploys separately on Vercel — see `client/vercel.json` (SPA rewrite for React Router)

**Not finished:** live payment provider setup (Dodo keys), actually clicking deploy.

---

## Plans

| Feature | Free | Pro | Agency |
|---------|------|-----|--------|
| AI reports | 1 total | Unlimited | Unlimited |
| Repositories | 1 | Up to 10 | Unlimited |
| Team seats | 1 | 1 | Up to 10 |
| Slack / Discord | No | Yes | Yes |
| PDF export | No | Yes | Yes |
| White-label PDFs | No | No | Yes |

Paid features are revoked when `subscription_status` is `past_due` or `cancelled`.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite), Tailwind, React Router |
| Backend | Node.js, Express |
| Auth | Passport GitHub OAuth + express-session (Mongo store) |
| Database | MongoDB (Mongoose) |
| Queue | Redis + BullMQ |
| AI | OpenAI (gpt-4o-mini / gpt-4o) |
| PDF | PDFKit |
| Payments | Dodo Payments (`dodopayments` SDK) |

---

## Project structure

```
github-summary/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Landing, Overview, Repos, Summaries, Billing, Team, …
│       ├── api/            # Fetch helpers (uses VITE_API_URL)
│       ├── components/     # Sidebar, modals, cards
│       └── hooks/          # useAuth, useToast
└── server/
    ├── index.js            # API server + BullMQ worker + digest scheduler (one process)
    ├── routes/             # auth, repos, summaries, billing, team, …
    ├── services/           # dodo, pdf, notifications, digests, reports
    ├── workers/            # pipeline + AI agents
    ├── models/             # User, Organization, Repository, DailySummary, …
    └── config/             # passport, planLimits, db
```

---

## How to run locally

You need **three processes** (plus ngrok if testing GitHub/Slack webhooks).

### Prerequisites

- Node.js 18+
- MongoDB Atlas connection string
- Upstash (or other) Redis URL
- GitHub OAuth App
- OpenAI API key
- ngrok (for public webhook URL)

### Environment

**`server/.env`** (example — fill with your values):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=https://YOUR-NGROK-URL.ngrok-free.app

MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...

SESSION_SECRET=long-random-string
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WEBHOOK_SECRET=...
OPENAI_API_KEY=...

SLACK_CLIENT_ID=          # optional
SLACK_CLIENT_SECRET=      # optional

DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_PAYMENTS_ENVIRONMENT=test_mode   # or live_mode
DODO_PRODUCT_PRO=                     # Dodo product_id for Pro
DODO_PRODUCT_AGENCY=                  # Dodo product_id for Agency
```

**`client/.env`:**

```env
VITE_API_URL=http://localhost:5000
```

(Or leave empty and use Vite’s `/api` + `/auth` proxy.)

GitHub OAuth callback must be:  
`${SERVER_URL}/auth/github/callback`

### Commands

```bash
# Terminal 1 — API (also runs the BullMQ worker + digest cron)
cd server && npm install && npm run dev

# Terminal 2 — Frontend
cd client && npm install && npm run dev

# Terminal 3 — Public tunnel for webhooks
ngrok http 5000
```

App: **http://localhost:5173**  
Health: **http://localhost:5000/health**

---

## Main app routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/login` | GitHub login |
| `/app/overview` | Dashboard |
| `/app/repos` | Repositories |
| `/app/summaries` | Summary list + generate report |
| `/app/summaries/:id` | Detail + PDF / feedback |
| `/app/analytics` | Charts & stats |
| `/app/webhooks` | Delivery log |
| `/app/billing` | Plans & upgrade |
| `/app/team` | Team members (Agency) |
| `/app/settings` | Integrations & org settings |
| `/invite/:token` | Accept team invite |

---

## What’s next (planned)

1. Fill Dodo env keys + create Pro/Agency products in Dodo dashboard  
2. Register webhook: `${SERVER_URL}/webhooks/dodo`  
3. **Deploy** — `render.yaml` blueprint deploys the API on Render's free tier; frontend deploys separately on Vercel (root directory: `client`)  
4. Production checklist (HTTPS URLs, OAuth callbacks, re-add repo webhooks)

---

## Notes for you (project owner)

- Free-tier limits are enforced in code (`planLimits.js`). For local testing you can temporarily set an org’s `plan_tier` to `pro` / `agency` in MongoDB.
- On Render's free instance type, the service spins down after 15 min idle. An incoming webhook wakes it up before the job runs, so push summaries still work (with a ~1 min cold-start delay). The digest cron only fires if the service happens to be awake at that moment — if reliable scheduled digests matter, upgrade this one service to a paid instance type later.
- When `SERVER_URL` / ngrok changes, update OAuth callbacks and re-add repos so GitHub webhooks point at the new URL.
- Payments use Dodo (`dodoService.js`). Without `DODO_PAYMENTS_API_KEY` / product IDs, checkout will error until you configure them.
