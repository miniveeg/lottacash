export function shortAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}…${address.slice(-chars)}`
}

export function formatSol(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

export function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}