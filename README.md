# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading for **lottacash.us**.

## Stack

- **Frontend**: Vite + React + TypeScript + Solana wallet adapter
- **Backend**: Express API (`server/`) — configs, signals, webhook, leaderboard
- **Storage (MVP)**: JSON files on the server (`server/data/`) + localStorage fallback on the client

## Run locally (two terminals)

### Terminal 1 — API
```bat
cd D:\lottacash\lottacash\server
npm install
npm run dev
```
API: http://localhost:3001  ·  Health: http://localhost:3001/api/health

### Terminal 2 — Frontend
```bat
cd D:\lottacash\lottacash
npm install
npm run dev
```
App: http://localhost:5173  (proxies `/api` → backend)

## API routes

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/health` | Health check |
| GET | `/api/leaderboard?timeframe=weekly` | Ranked wallets |
| GET | `/api/configs?owner=<wallet>` | User copy configs |
| POST | `/api/configs` | Create/update config |
| DELETE | `/api/configs?owner=&target=` | Remove config |
| GET | `/api/signals?owner=<wallet>` | Trade signals |
| PATCH | `/api/signals/:id` | Update signal status |
| POST | `/api/signals/demo` | Create demo signal |
| POST | `/api/webhook/trade` | External monitor webhook |
| GET | `/api/watched` | Targets currently watched |

Webhook auth: header `x-webhook-secret: dev-secret-change-me` (change in production).

## Architecture

1. User connects wallet and saves copy settings → API stores by `ownerWallet`
2. Monitor (Helius webhook / future worker) posts to `/api/webhook/trade`
3. Server creates a **pending signal** for each user copying that target
4. Frontend Activity page loads signals → user signs Jupiter swap
5. Platform never holds private keys

## Still to build

- Real ranking indexer
- Live Helius (or similar) subscription worker
- Postgres instead of JSON files
- Auth (sign-in with Solana message) for mutating configs
- Production deploy (Vercel frontend + Railway/Fly server)
