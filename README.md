# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading for **lottacash.us**.

## Stack

- **Frontend**: Vite + React + TypeScript + Solana wallet adapter
- **Backend**: Express API + **monitor worker** (RPC / optional Helius)
- **Storage (MVP)**: JSON files (`server/data/`) + localStorage fallback

## Run locally (two terminals)

### Terminal 1 — API + monitor
```bat
cd D:\lottacash\lottacash\server
copy .env.example .env
npm install
npm run dev
```
API: http://localhost:3001  
Health (includes monitor status): http://localhost:3001/api/health

Optional in `server/.env`:
```
HELIUS_API_KEY=your_helius_key
MONITOR_ENABLED=true
MONITOR_INTERVAL_MS=45000
WEBHOOK_SECRET=change-me
```

### Terminal 2 — Frontend
```bat
cd D:\lottacash\lottacash
npm install
npm run dev
```
App: http://localhost:5173

## Services

### 1. Monitor worker
- Polls **watched targets** (enabled copy configs) on an interval
- With **Helius key**: uses enhanced transactions + swap parsing
- Without key: public RPC signatures + Jupiter program detection
- Creates **pending signals** for each user copying that wallet
- Status: `GET /api/monitor/status` · force run: `POST /api/monitor/run`

### 2. Webhook (Helius Address Activity)
Point a Helius webhook to:
```
POST https://YOUR_API/api/webhook/trade
Header: x-webhook-secret: <WEBHOOK_SECRET>
```
Body can be our simple schema or Helius-like payloads (`feePayer`, `tokenTransfers`).

### 3. Leaderboard
Seed ranks + light activity boost from monitor. Replace with Birdeye/Dune indexer when you have keys.

## Deploy

### Frontend (Vercel)
1. Import the GitHub repo in Vercel
2. Root directory: project root
3. Build: `npm run build` · Output: `dist`
4. Env: `VITE_API_URL=https://your-api.example.com/api`
5. `vercel.json` already does SPA rewrites

### API (Railway / Fly / Render)
1. Deploy `server/` with the Dockerfile or `npm run build && npm start`
2. Set env from `server/.env.example`
3. Attach a volume for `server/data` if you want persistence across restarts
4. Set `HELIUS_API_KEY` for reliable monitoring

### Domain
- `lottacash.us` → Vercel frontend
- `api.lottacash.us` → API host

## API routes

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/health` | Health + monitor snapshot |
| GET | `/api/monitor/status` | Worker status |
| POST | `/api/monitor/run` | Run one poll cycle |
| GET | `/api/leaderboard` | Ranked wallets |
| GET/POST/DELETE | `/api/configs` | Copy configs |
| GET/PATCH | `/api/signals` | Signals |
| POST | `/api/signals/demo` | Demo signal |
| POST | `/api/webhook/trade` | External monitor webhook |
| GET | `/api/watched` | Watched targets |

## Architecture

1. User connects wallet → saves copy config (API + local fallback)
2. Monitor worker and/or Helius webhook detects target trades
3. Server creates **pending signals**
4. User opens Activity → signs Jupiter swap in their wallet
5. Platform never holds private keys

## Still optional / next

- Paid ranking indexer (Birdeye / custom Dune)
- Postgres instead of JSON files
- Sign-in with Solana for multi-device auth
- Tighter swap instruction parsing (exact mint + size)
