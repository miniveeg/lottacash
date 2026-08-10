# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading platform.

Users connect their own wallet. You never generate or hold private keys.  
Trades are prepared by the platform and signed by the user.

## Core Principles

- **True non-custodial**: User connects existing Phantom / Solflare / Backpack wallet.
- No platform-generated trading wallets.
- No private keys ever leave the user's device.
- Copy size: fixed SOL amount **or** proportional / 1:1 with optional max.
- Leaderboard of top wallets (daily / weekly / all-time).
- Automatic detection of target wallet buys/sells → prepared Jupiter swap for user to sign.

## Tech Stack

- Vite 5 + React 18 + TypeScript
- Solana Wallet Adapter
- React Router
- Jupiter Aggregator (planned for swap construction)
- Helius / RPC for monitoring (planned)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure (current)

```
src/
  components/     # UI components (Topbar, WalletButton, etc.)
  pages/          # Home, Leaderboard, Copy settings
  contexts/       # Wallet context
  lib/            # helpers, types
  styles/         # global + theme
```

## Roadmap

1. ✅ Project scaffold + wallet connect
2. Leaderboard UI + mock data
3. User copy configuration (size mode, max size, slippage)
4. Real wallet ranking data pipeline
5. Real-time monitoring service
6. Jupiter transaction builder + user signing flow
7. Positions / history view
8. Risk controls + disclaimers

## Domain

lottacash.us

---

Built with a strict non-custodial design so users keep full control of their funds at all times.