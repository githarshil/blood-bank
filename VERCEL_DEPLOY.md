# Deploy on Vercel (Frontend + API + Railway MySQL)

One Vercel project serves:
- **React app** (static files from `blood-bank-frontend/dist`)
- **Express API** (serverless at `/api/*` and `/health`)
- **MySQL** stays on **Railway** (or any cloud MySQL)

---

## Prerequisites

- [ ] GitHub repo with this project
- [ ] Railway MySQL set up and `database/railway-init.sql` already run
- [ ] [Vercel account](https://vercel.com)

---

## Step 1 — Push to GitHub

```bash
cd "c:\Users\harsh_aaghwa2\OneDrive\Desktop\dbms mini project"
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

---

## Step 2 — Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository
3. **Framework Preset:** Other (Vercel reads `vercel.json`)
4. **Root Directory:** `.` (repo root — do not set to `blood-bank-frontend` only)
5. Leave **Build** settings as defined in `vercel.json`:
   - Install: `npm install && cd blood-bank-frontend && npm install`
   - Build: `cd blood-bank-frontend && npm run build`
   - Output: `blood-bank-frontend/dist`

---

## Step 3 — Environment variables

In Vercel → your project → **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `DB_HOST` | `zephyr.proxy.rlwy.net` (your Railway host) | Production, Preview |
| `DB_PORT` | `30453` | Production, Preview |
| `DB_USER` | `root` | Production, Preview |
| `DB_PASSWORD` | Your Railway password | Production, Preview |
| `DB_NAME` | `railway` | Production, Preview |
| `DB_SSL` | `false` | Production, Preview |
| `NODE_ENV` | `production` | Production |

**Do not set** `VITE_API_URL` on Vercel — the frontend uses same-origin `/api` routes automatically.

**Optional** `CORS_ORIGIN` — only needed if you host the frontend elsewhere. Vercel `*.vercel.app` URLs are allowed by default.

---

## Step 4 — Deploy

1. Click **Deploy**
2. Wait for build to finish (2–5 minutes)
3. Open your URL: `https://your-project.vercel.app`

---

## Step 5 — Verify

| URL | Expected |
|-----|----------|
| `https://your-app.vercel.app` | React dashboard loads |
| `https://your-app.vercel.app/health` | `{"status":"OK",...}` |
| `https://your-app.vercel.app/api/inventory` | JSON inventory data |

Test in the app: **Dashboard**, **Donors** → Log Donation, **Reports**.

---

## Project layout (Vercel)

```
api/index.js          → Serverless Express handler
app.js                → Express routes & middleware
server.js             → Local dev only (npm start)
vercel.json           → Build + rewrites
blood-bank-frontend/  → React app (built to dist/)
database/railway-init.sql
```

---

## Local development (unchanged)

**Terminal 1 — API:**
```bash
npm start
```

**Terminal 2 — Frontend:**
```bash
cd blood-bank-frontend
npm run dev
```

Use `.env` in project root with Railway/MySQL credentials for local API testing.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API 404 on Vercel | Ensure `vercel.json` rewrites exist; redeploy |
| CORS error | Add your URL to `CORS_ORIGIN` or use same Vercel domain |
| DB connection error | Check Railway public networking; verify `DB_*` vars |
| Frontend calls `localhost` | **Delete** `VITE_API_URL` from Vercel env if it contains localhost; redeploy |
| `Network Error` on Dashboard | Fix API routing (use latest `api/[...path].js`); confirm `/api/health` works in browser |
| Cold start slow | First API request after idle may take 5–15s (serverless) |
| `FUNCTION_INVOCATION_FAILED` | Check Vercel **Functions** logs; usually bad `DB_PASSWORD` |

---

## Split deploy (optional)

| Service | Host |
|---------|------|
| Frontend only | Vercel — root: `blood-bank-frontend` |
| API only | Render/Railway — `npm start` |
| Set `VITE_API_URL` | `https://your-api.onrender.com` |

For this project, **one Vercel app** (full stack) is the simplest setup.

---

## Environment reference

**Vercel (required):** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `NODE_ENV`

**Vercel (auto):** `VERCEL`, `VERCEL_URL` — used for CORS

**Frontend:** `VITE_API_URL` — omit on Vercel monorepo deploy

Your app is ready for Vercel.
