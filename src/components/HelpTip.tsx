import { useState } from 'react'

export function HelpTip({ title, children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`help-tip ${open ? 'open' : ''}`}>
      <button type="button" className="help-tip-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="help-tip-icon">?</span>
        {title || 'What is this?'}
        <span className="help-tip-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="help-tip-body">{children}</div>}
    </div>
  )
}