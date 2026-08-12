export function StatusDot({
  ok,
  labelOn = 'Online',
  labelOff = 'Offline',
}: {
  ok: boolean | null
  labelOn?: string
  labelOff?: string
}) {
  if (ok === null) {
    return <span className="status-dot checking">Checking…</span>
  }
  return (
    <span className={`status-dot ${ok ? 'on' : 'off'}`}>
      <span className="status-dot-pip" />
      {ok ? labelOn : labelOff}
    </span>
  )
}