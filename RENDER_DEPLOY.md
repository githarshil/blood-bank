# Deploy Blood Bank System on Render

> **Deploy on Vercel instead?** See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) (frontend + API on one Vercel app).

This guide deploys the **backend API** and **React frontend** on [Render](https://render.com), with a **cloud MySQL** database (Render does not host MySQL).

**Architecture**

| Component | Render service | URL example |
|-----------|--------------|-------------|
| React app | Static Site | `https://blood-bank-frontend.onrender.com` |
| Express API | Web Service | `https://blood-bank-api.onrender.com` |
| MySQL | External (Aiven / Railway / etc.) | — |

---

## Prerequisites

1. [GitHub](https://github.com) account  
2. [Render](https://render.com) account (free tier works)  
3. Project pushed to a **GitHub repository**  
4. A **cloud MySQL** database (see Step 1)

---

## Step 1 — Create a cloud MySQL database

Render does not provide MySQL. Use one of these free/low-cost options:

### Option A: Aiven (recommended)

1. Go to [aiven.io](https://aiven.io) → sign up → **Create service** → **MySQL**.  
2. Choose the **free** plan if available, or smallest paid tier.  
3. After creation, open **Connection information** and note:
   - Host  
   - Port  
   - User  
   - Password  
   - Database name (default often `defaultdb`)  
4. Enable **Public access** if connections from Render fail.  
5. Set `DB_SSL=true` in Render (Aiven requires SSL).

### Option B: Railway

1. [railway.app](https://railway.app) → New Project → **Add MySQL**.  
2. Copy connection variables from the MySQL service **Variables** tab.

### Import the schema

1. Open your MySQL client (Aiven web console, MySQL Workbench, or CLI).  
2. Run the file **`database/init.sql`** from this project.  
3. Confirm tables exist: `donor`, `donation`, `blood_inventory`, `blood_request`, `alerts`.

---

## Step 2 — Push code to GitHub

```bash
cd "dbms mini project"
git init
git add .
git commit -m "Prepare for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Ensure `.env` is **not** committed (it is in `.gitignore`).

---

## Step 3 — Deploy the backend (Web Service)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.  
2. Connect your GitHub repo.  
3. Configure:

   | Setting | Value |
   |---------|--------|
   | **Name** | `blood-bank-api` |
   | **Region** | Closest to you |
   | **Branch** | `main` |
   | **Root Directory** | *(leave empty — repo root)* |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

4. **Instance type**: Free  

5. **Environment variables** (Environment → Add):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `DB_HOST` | Your MySQL host |
   | `DB_PORT` | `3306` (or provider port) |
   | `DB_USER` | Your MySQL user |
   | `DB_PASSWORD` | Your MySQL password |
   | `DB_NAME` | `bloodbankdb` (or your DB name) |
   | `DB_SSL` | `true` (for Aiven/Railway; use `false` only if host has no SSL) |
   | `CORS_ORIGIN` | Leave empty for now — add frontend URL after Step 4 |

   `PORT` is set automatically by Render — do not override it.

6. Click **Create Web Service**. Wait until deploy is **Live**.  
7. Test: open `https://blood-bank-api.onrender.com/health` — you should see `"status":"OK"`.  
8. If health works but API fails, check **Logs** for database connection errors.

---

## Step 4 — Deploy the frontend (Static Site)

1. **New +** → **Static Site** → same GitHub repo.  
2. Configure:

   | Setting | Value |
   |---------|--------|
   | **Name** | `blood-bank-frontend` |
   | **Branch** | `main` |
   | **Root Directory** | *(empty)* |
   | **Build Command** | `cd blood-bank-frontend && npm install && npm run build` |
   | **Publish Directory** | `blood-bank-frontend/dist` |

3. **Environment variable** (required at build time):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://blood-bank-api.onrender.com` *(your backend URL, no trailing slash)* |

4. **Create Static Site**. Wait for deploy.  
5. Copy your frontend URL, e.g. `https://blood-bank-frontend.onrender.com`.

---

## Step 5 — Connect frontend and backend (CORS)

1. Open the **blood-bank-api** service on Render.  
2. **Environment** → edit `CORS_ORIGIN`:

   ```
   https://blood-bank-frontend.onrender.com
   ```

   Use your exact Static Site URL (no trailing slash). For local + production:

   ```
   http://localhost:3000,https://blood-bank-frontend.onrender.com
   ```

3. **Save** — Render will redeploy the API automatically.

---

## Step 6 — Verify the live app

1. Open the **frontend** URL.  
2. **Dashboard** — inventory loads.  
3. **Donors** — register a donor, click **Log Donation**.  
4. **Reports** — generate monthly report.  
5. If requests fail, open browser **DevTools → Network** and confirm API calls go to `VITE_API_URL`, not `localhost`.

---

## Optional: Blueprint deploy (`render.yaml`)

If your repo includes `render.yaml`:

1. **New +** → **Blueprint** → connect repo.  
2. Render creates both services; you still must set secret env vars (`DB_*`, `VITE_API_URL`, `CORS_ORIGIN`) in the dashboard.

---

## Optional: Single Web Service (API + frontend)

Deploy only one Web Service that serves both:

1. **Build Command**: `npm run build:all`  
2. **Start Command**: `npm start`  
3. Extra env vars:
   - `SERVE_FRONTEND=true`
   - `CORS_ORIGIN` = your same service URL  
4. **Build** `VITE_API_URL` to the same backend URL before `build:all`, or set in build env.

Most students use **two services** (Step 3 + 4) for clearer separation.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `CORS blocked` | Set `CORS_ORIGIN` to exact frontend URL (https, no slash). |
| API calls go to `localhost` | Redeploy frontend after setting `VITE_API_URL`. |
| Database connection error | Check `DB_*` vars, `DB_SSL=true`, allow public access on MySQL host. |
| Blank page on refresh | `public/_redirects` is included for SPA routing on Render Static. |
| Free API sleeps after 15 min | First request may take ~30s — normal on free tier. |
| `ER_NO_SUCH_TABLE` | Run `database/init.sql` on cloud MySQL. |

---

## Environment variable reference

**Backend** (Render Web Service)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto | Set by Render |
| `NODE_ENV` | Yes | `production` |
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | Yes | Usually `3306` |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name |
| `DB_SSL` | Often | `true` for cloud MySQL |
| `CORS_ORIGIN` | Yes | Frontend URL(s), comma-separated |
| `SERVE_FRONTEND` | No | `true` for single-service deploy |

**Frontend** (Render Static Site — build time)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL, e.g. `https://blood-bank-api.onrender.com` |

---

## Quick checklist

- [ ] `database/init.sql` executed on cloud MySQL  
- [ ] Code on GitHub, `.env` not committed  
- [ ] Backend Web Service live, `/health` OK  
- [ ] Frontend Static Site live  
- [ ] `VITE_API_URL` points to backend  
- [ ] `CORS_ORIGIN` points to frontend  
- [ ] App tested: donors, donations, reports  

Your Blood Bank system is live on Render.
