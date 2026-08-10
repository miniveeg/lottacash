# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading platform for **lottacash.us**.

Users connect their own wallet. The platform never generates or holds private keys.  
Trades are prepared (Jupiter) and signed by the user.

## Current Status

- ✅ Vite + React + TypeScript scaffold
- ✅ Solana wallet adapter (Phantom, Solflare)
- ✅ Leaderboard UI with Daily / Weekly / All-time tabs
- ✅ Copy configuration (fixed SOL or proportional + max + slippage)
- ✅ Local persistence of copy settings (`localStorage`)
- ✅ Active Copies page (enable / disable / edit / remove)
- ✅ Jupiter quote + swap helpers ready for real integration
- ⏳ Real wallet ranking data pipeline
- ⏳ Real-time target wallet monitoring
- ⏳ Push prepared transactions to the connected wallet for signing
- ⏳ Backend persistence + multi-device sync

## Quick Start

```bash
git clone https://github.com/miniveeg/lottacash.git
cd lottacash
npm install
npm run dev
```

Open http://localhost:5173

## Architecture (non-custodial)

1. User connects existing wallet.
2. User selects target wallets + sizing rules.
3. Backend (future) monitors target addresses.
4. On detected trade → Jupiter quote → build unsigned swap.
5. Frontend asks the user to sign.
6. User remains in full control of funds at every step.

## Key files

| Path | Purpose |
|------|--------|
| `src/lib/copyStore.ts` | Local copy config persistence |
| `src/lib/jupiter.ts` | Quote + swap transaction helpers |
| `src/lib/mockData.ts` | Temporary leaderboard data |
| `src/pages/Leaderboard.tsx` | Ranked wallets |
| `src/pages/CopySetup.tsx` | Per-wallet copy settings |
| `src/pages/ActiveCopies.tsx` | Manage active copies |

## Next engineering steps

1. Replace `mockData` with a real ranking source (Helius / Bitquery / custom indexer).
2. Add a lightweight backend (or Supabase Edge Functions) to store configs per wallet and emit trade signals.
3. Wire monitoring → Jupiter → `signTransaction` flow.
4. Add positions / trade history view.
5. Stronger risk controls (token denylist, max daily volume, kill switch).

## Domain

lottacash.us

---

**Important:** This is not financial advice. Copy trading is high risk. Users can lose their entire balance.
