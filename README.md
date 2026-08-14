# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading for **lottacash.us**.

## Stack

- **Frontend**: Vite + React + TypeScript + Solana wallet adapter
- **Backend**: Express API + monitor worker (RPC / optional Helius)
- **Fees**: Jupiter `platformFeeBps` (default **0.5%** = 50 bps) → your treasury wallet
- **Storage (MVP)**: JSON files (`server/data/`) + localStorage fallback

## How you make money

On every **signed** copy swap (buy or sell):

| User trade size | Your fee at 0.5% |
|-----------------|------------------|
| $5 | **~$0.025** |
| $100 | **~$0.50** |
| 1 SOL | **0.005 SOL** |

Fee is included in the Jupiter transaction the user signs. You never custody funds.

### Enable fees

In project root `.env`:

```env
VITE_PLATFORM_FEE_BPS=50
VITE_FEE_WALLET=YourTreasuryPublicKey
```

Create a **WSOL associated token account** on that treasury wallet so SOL-pair fees can land.

Stats: `GET /api/fees/stats`

## Run locally

### Terminal 1 — API + monitor
```bat
cd D:\lottacash\lottacash\server
copy .env.example .env
npm install
npm run dev
```

Optional in `server/.env`:
```
HELIUS_API_KEY=
MONITOR_ENABLED=true
WEBHOOK_SECRET=change-me
```

### Terminal 2 — Frontend
```bat
cd D:\lottacash\lottacash
npm install
npm run dev
```

App: http://localhost:5173

## Architecture

1. User connects wallet → saves copy config
2. Monitor worker / Helius webhook detects target trades → pending signals
3. User opens Activity → signs Jupiter swap (with platform fee)
4. Fee lands in your `feeAccount`; trade lands in their wallet

## Deploy

- **Frontend**: Vercel (set `VITE_API_URL`, `VITE_FEE_WALLET`, `VITE_PLATFORM_FEE_BPS`)
- **API**: Railway / Fly / Render (`server/` + Dockerfile)
- Domain: `lottacash.us` → frontend, `api.lottacash.us` → API
