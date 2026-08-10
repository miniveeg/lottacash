# LottaCash — Solana Copy Trading

Non-custodial Solana copy trading for **lottacash.us**.

You connect your own wallet. The app never generates or stores private keys.  
Trades are prepared with Jupiter and **signed by you**.

## What’s built

- Wallet connect (Phantom, Solflare)
- Leaderboard (Daily / Weekly / All-time) — mock data, ready for real ranking API
- Copy setup: fixed SOL **or** proportional, max cap, slippage
- Local persistence of copy configs
- **My Copies** management (on/off/edit/remove)
- **Activity** page with demo trade signals
- **Full Jupiter quote → user sign → send** demo path
- Monitoring architecture stubs (`src/lib/monitor.ts`)
- Configurable RPC via `.env`
- Mobile bottom navigation
- Settings + risk reminders

## Quick start

```bash
git clone https://github.com/miniveeg/lottacash.git
cd lottacash
cp .env.example .env   # optional: set your RPC
npm install
npm run dev
```

Open http://localhost:5173

### Test the signing flow

1. Connect wallet  
2. Leaderboard → Copy a wallet → save settings (enabled)  
3. **Activity** → **Generate demo signal**  
4. **Sign swap** (uses a small real Jupiter quote path; be careful on mainnet)

Use **devnet** + a private RPC when testing real sends.

## Architecture

```
User wallet ──connect──▶ App
                          │
                 save CopyConfig (local / future backend)
                          │
         [future] Monitor target wallets (Helius / gRPC)
                          │
                 TradeSignal created
                          │
              Jupiter quote + swap tx
                          │
                 User signs in wallet
                          │
                    Tx on-chain
```

## Env

See `.env.example`:

- `VITE_SOLANA_RPC_URL` — private RPC recommended
- `VITE_SOLANA_NETWORK` — `mainnet-beta` or `devnet`

## Still needed for production

1. Real profitable-wallet ranking pipeline  
2. Backend (or Supabase) for configs + multi-device sync  
3. Live wallet monitoring (webhooks / gRPC)  
4. Signal delivery to the correct user  
5. Token safety filters, max daily loss, kill switch  
6. Hosting on lottacash.us (Vercel works well)

## License

Proprietary — LottaCash.
