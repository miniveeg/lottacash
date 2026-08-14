import { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { listSignals, updateSignalStatus } from '../lib/monitor'
import { listCopyConfigs } from '../lib/copyStore'
import { executeDemoSwap } from '../lib/executeSwap'
import { patchSignal, apiHealth } from '../lib/api'
import {
  getAutoSignSettings,
  bumpAutoSignStat,
  disableAutoSign,
  wasAutoAttempted,
  markAutoAttempted,
  saveAutoSignSettings,
} from '../lib/autoSign'
import { useToast } from './Toast'

/**
 * Background loop: when experimental auto-sign is enabled, attempt to sign
 * pending signals. Wallet may still prompt unless the user enabled auto-approve.
 */
export function AutoSignWorker() {
  const wallet = useWallet()
  const { push } = useToast()
  const busy = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function tick() {
      if (cancelled || busy.current) return
      const settings = getAutoSignSettings()
      if (!settings.enabled || !settings.acknowledged) return

      if (settings.onlyWhenFocused && document.visibilityState !== 'visible') return

      if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) return

      if (settings.sessionSigned >= settings.maxPerSession) {
        disableAutoSign('Session max auto-trades reached')
        push('Auto-sign stopped: session limit reached', 'info')
        return
      }

      const pending = listSignals().filter((s) => s.status === 'pending' && !wasAutoAttempted(s.id))
      if (pending.length === 0) {
        saveAutoSignSettings({ lastRunAt: Date.now() })
        return
      }

      const signal = pending[0]
      markAutoAttempted(signal.id)
      busy.current = true

      const cfg = listCopyConfigs().find((c) => c.targetAddress === signal.targetAddress)
      const slippageBps = cfg?.slippageBps ?? 200
      const maxCap = Math.min(
        settings.maxSolPerTrade,
        cfg?.maxSol ?? settings.maxSolPerTrade,
        signal.suggestedSol
      )
      const solAmount = Math.max(0.01, maxCap)

      try {
        push(`Auto-sign: attempting ${signal.side} ~${solAmount} SOL…`, 'info')
        const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        const mint = signal.tokenMint || USDC
        const sig = await executeDemoSwap({
          wallet,
          side: signal.side,
          tokenMint: mint,
          solAmount,
          slippageBps,
        })

        updateSignalStatus(signal.id, 'signed', { txSignature: sig })
        try {
          if (await apiHealth()) {
            await patchSignal(signal.id, { status: 'signed', txSignature: sig })
          }
        } catch {
          /* ignore */
        }
        bumpAutoSignStat('signed')
        push(`Auto-sign completed · ${sig.slice(0, 10)}…`, 'success')
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e)
        updateSignalStatus(signal.id, 'failed', { error: `auto-sign: ${err}` })
        try {
          if (await apiHealth()) {
            await patchSignal(signal.id, { status: 'failed', error: err })
          }
        } catch {
          /* ignore */
        }
        bumpAutoSignStat('failed', err)
        push(`Auto-sign failed: ${err.slice(0, 80)}`, 'error')
        // User rejected / wallet closed — pause auto-sign so we don't spam
        if (/reject|cancel|denied|user rejected/i.test(err)) {
          disableAutoSign('Wallet rejected — auto-sign paused')
          push('Auto-sign turned off after wallet rejection', 'info')
        }
      } finally {
        busy.current = false
      }
    }

    const settings = getAutoSignSettings()
    const ms = (settings.pollSeconds || 12) * 1000
    const id = window.setInterval(() => {
      tick().catch(console.error)
    }, ms)
    // small initial delay
    const t0 = window.setTimeout(() => tick().catch(console.error), 2500)

    return () => {
      cancelled = true
      clearInterval(id)
      clearTimeout(t0)
    }
  }, [wallet.connected, wallet.publicKey, wallet.signTransaction, push, wallet])

  return null
}
