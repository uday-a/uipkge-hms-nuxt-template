// Single source of truth for date / time rendering across the app.
// Pages used to ship their own `fmtDate`, `fmtTime`, raw ISO strings,
// and `toLocaleDateString` calls with different options -- making lists
// look inconsistent across modules. Route every render through these
// helpers so the surface looks identical on every page.
//
// Locale defaults to `en-IN` to match the rest of the template's
// currency formatting (also `en-IN`). Override per-call when needed.

/** "12 Mar 1958" -- compact 3-letter month, no time. */
export function formatDate(iso: string | Date, locale = 'en-IN'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "12 Mar 1958, 14:30" -- 24-hour time, comma between date + time. */
export function formatDateTime(iso: string | Date, locale = 'en-IN'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** "14:30" -- 24-hour clock only. */
export function formatTime(iso: string | Date, locale = 'en-IN'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "2m ago" / "5h ago" / "3d ago". Falls back to formatDate after 7 days. */
export function relativeTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const ms = Date.now() - d.getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}
