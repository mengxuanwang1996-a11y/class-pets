# Deploy to Railway (Recommended)

## Quick Deploy

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select this repository
5. Railway will auto-detect Node.js and deploy

## Environment Variables

Set in Railway dashboard:

| Variable | Value |
|----------|-------|
| `PORT` | `3001` |
| `CORS_ORIGINS` | `https://your-frontend-domain.com,capacitor://localhost` |
| `JWT_SECRET` | `your-secure-random-string` |

## Database Options

### Option 1: PostgreSQL (Recommended for Production)

1. In Railway dashboard, add a PostgreSQL database
2. Copy the `DATABASE_URL` connection string
3. Add it to environment variables

### Option 2: sql.js (File-based, Default)

Uses `sql.js` with file persistence at `./data.db`. Works on Railway but data resets when the container restarts.

---

# Deploy to Render

1. Go to [Render.com](https://render.com)
2. Sign up and connect GitHub
3. Create "Web Service"
4. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables same as above

---

# Deploy to Vercel (Serverless)

Create `serverless.yml`:

```yaml
serverless-http:
  provider:
    name: aws
    runtime: nodejs18.x
    stage: prod
    region: us-east-1
```

Note: Vercel serverless functions don't support long-running processes. Consider Railway or Render instead.

---

# HTTPS

All cloud platforms provide HTTPS automatically. Update your `.env.production`:

```
VITE_API_URL=https://your-railway-app.railway.app/api
```
