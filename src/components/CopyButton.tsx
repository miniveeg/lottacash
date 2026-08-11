import { useState } from 'react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <button type="button" className="btn small" onClick={onClick}>
      {done ? 'Copied' : label}
    </button>
  )
}