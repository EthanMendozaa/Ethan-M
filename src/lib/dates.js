export const DAY_MS = 24 * 60 * 60 * 1000

export function todayKey() {
  return toKey(new Date())
}

export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function shortDate(key) {
  return keyToDate(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function weekday(key) {
  return keyToDate(key).toLocaleDateString('en-US', { weekday: 'short' })
}

export function longDate(key) {
  return keyToDate(key).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
