// Date helpers for mock data — all dates are derived from TODAY so the
// template always shows "live" data relative to whenever it's opened.

// Freeze TODAY to midnight UTC so mock dates are stable between SSR and
// client hydration, even if the modules are evaluated seconds apart or on
// machines in different timezones.
const now = new Date()
export const TODAY = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

export const tomorrow = () => new Date(TODAY.getTime() + 86_400_000)
export const yesterday = () => new Date(TODAY.getTime() - 86_400_000)
export const daysAgo = (d: number) => new Date(TODAY.getTime() - d * 86_400_000)
export const daysFromNow = (d: number) => new Date(TODAY.getTime() + d * 86_400_000)
export const hoursAgo = (h: number) => new Date(TODAY.getTime() - h * 3_600_000)
export const hoursFromNow = (h: number) => new Date(TODAY.getTime() + h * 3_600_000)
export const minutesAgo = (m: number) => new Date(TODAY.getTime() - m * 60_000)
export const minutesFromNow = (m: number) => new Date(TODAY.getTime() + m * 60_000)

// Return YYYY-MM-DD string
export const isoDate = (d: Date) => d.toISOString().slice(0, 10)

// Return full ISO string
export const iso = (d: Date) => d.toISOString()

// Helpers for constructing times on a given day.
// All use UTC so server and client produce identical ISO strings.
export const todayAt = (h: number, m = 0) => {
  const d = new Date(TODAY)
  d.setUTCHours(h, m, 0, 0)
  return d.toISOString()
}

export const tomorrowAt = (h: number, m = 0) => {
  const d = new Date(tomorrow())
  d.setUTCHours(h, m, 0, 0)
  return d.toISOString()
}

export const yesterdayAt = (h: number, m = 0) => {
  const d = new Date(yesterday())
  d.setUTCHours(h, m, 0, 0)
  return d.toISOString()
}

export const daysAgoAt = (days: number, h: number, m = 0) => {
  const d = new Date(daysAgo(days))
  d.setUTCHours(h, m, 0, 0)
  return d.toISOString()
}
