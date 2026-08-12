// All of the mockup's "intelligence" in one deterministic module.
// Every number the UI shows as smart is computed here from the day records.

import { keyToDate, DAY_MS } from './dates'
import { VOLUME_BAND, MUSCLE_GROUPS, MAIN_LIFTS, EXERCISES, ARNOLD_DAYS } from './programs'

// ---------- Trend weight (EWMA, α = 0.25) ----------

export function trendWeightSeries(days) {
  const out = []
  let trend = null
  for (const d of days) {
    if (d.weightLb != null) {
      trend = trend == null ? d.weightLb : trend + 0.25 * (d.weightLb - trend)
    }
    out.push({ key: d.key, scale: d.weightLb, trend: trend != null ? Math.round(trend * 100) / 100 : null })
  }
  return out
}

// Weight-journey stats for the dedicated Weight screen.
export function weightJourney(days, goalLb = 145) {
  const trend = trendWeightSeries(days).filter((t) => t.trend != null)
  if (trend.length < 8) return null
  const now = trend[trend.length - 1].trend
  const start = trend[0].trend
  const weekAgo = trend[Math.max(0, trend.length - 8)].trend
  const monthAgo = trend[Math.max(0, trend.length - 29)].trend
  const weekDelta = Math.round((now - weekAgo) * 10) / 10
  const span = Math.min(28, trend.length - 1)
  const ratePerWeek = Math.round(((now - monthAgo) / span) * 7 * 100) / 100
  // Projected goal date at the current 28-day rate
  let goalKey = null
  if (ratePerWeek < -0.05 && now > goalLb) {
    const daysLeft = Math.round((now - goalLb) / (-ratePerWeek / 7))
    if (daysLeft < 400) goalKey = addDaysKey(trend[trend.length - 1].key, daysLeft)
  }
  return {
    now,
    start,
    weekDelta,
    ratePerWeek,
    totalDelta: Math.round((now - start) * 10) / 10,
    goalLb,
    goalKey,
    toGo: Math.round((now - goalLb) * 10) / 10,
    progress: Math.max(0, Math.min(1, (start - now) / Math.max(0.1, start - goalLb))),
  }
}

// Every whole-pound line crossed on the way down ("drops"), newest first.
export function weightMilestones(days) {
  const trend = trendWeightSeries(days).filter((t) => t.trend != null)
  const seen = new Set()
  const out = []
  for (let i = 1; i < trend.length; i++) {
    const prev = trend[i - 1].trend
    const cur = trend[i].trend
    for (let m = Math.floor(prev); m > cur; m--) {
      if (prev >= m && cur < m && !seen.has(m)) {
        seen.add(m)
        out.push({ lb: m, key: trend[i].key })
      }
    }
  }
  return out.reverse()
}

// Consecutive days with a logged weigh-in (today pending doesn't break it).
export function weighInStreak(days) {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].isToday && days[i].weightLb == null) continue
    if (days[i].weightLb != null) streak += 1
    else break
  }
  return streak
}

function addDaysKey(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ---------- TDEE ----------
// Displayed expenditure recomputes continuously over the trailing 14 days of
// intake + trend-weight change (so a new weigh-in nudges it immediately).
// Coaching *targets* only move at the weekly check-in, clamped to ±100 kcal.

export function tdeeAt(days, endIdx) {
  const trend = trendWeightSeries(days)
  const windowDays = []
  for (let i = Math.max(0, endIdx - 13); i <= endIdx; i++) windowDays.push(i)
  const withTrend = windowDays.filter((i) => trend[i].trend != null)
  if (withTrend.length < 7) return null
  const first = withTrend[0]
  const last = withTrend[withTrend.length - 1]
  const span = last - first
  if (span < 5) return null
  const deltaPerDay = (trend[last].trend - trend[first].trend) / span
  const intakes = windowDays
    .filter((i) => !days[i].partial) // today's log is incomplete — skip it
    .map((i) => days[i].intake?.kcal)
    .filter((k) => k != null)
  const meanIntake = intakes.reduce((s, k) => s + k, 0) / intakes.length
  return Math.round(meanIntake - deltaPerDay * 3500)
}

export function tdeeSeries(days) {
  const out = []
  for (let i = 0; i < days.length; i++) {
    const v = tdeeAt(days, i)
    if (v != null) out.push({ key: days[i].key, tdee: v })
  }
  return out
}

// Weekly coaching check-in: compare observed rate vs target, adjust kcal target.
export function weeklyCheckIn(days) {
  const trend = trendWeightSeries(days)
  const valid = trend.filter((t) => t.trend != null)
  if (valid.length < 15) return null
  const now = valid[valid.length - 1].trend
  const weekAgo = valid[Math.max(0, valid.length - 8)].trend
  const observedRate = Math.round((now - weekAgo) * 100) / 100 // lb/week, negative = loss
  const targetRate = -1.0
  const gap = observedRate - targetRate // negative → losing faster than planned → eat more
  const adjustment = Math.max(-100, Math.min(100, Math.round((-gap * 3500) / 7 / 10) * 10))
  const tdee = tdeeAt(days, days.length - 1) ?? 2500
  const oldTarget = 2050
  return {
    observedRate,
    targetRate,
    oldTarget,
    newTarget: oldTarget + adjustment,
    adjustment,
    tdee,
  }
}

export function macroTargets(kcalTarget) {
  const protein = 160
  const fat = Math.round((kcalTarget * 0.25) / 9)
  const carbs = Math.round((kcalTarget - protein * 4 - fat * 9) / 4)
  return { kcal: kcalTarget, protein, carbs, fat }
}

// ---------- Daily scores (0–100) ----------

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

export function metricBaseline(days, idx, field, window = 28) {
  return baseline(days, idx, field, window)
}

function baseline(days, idx, field, window = 28) {
  const vals = []
  for (let i = Math.max(0, idx - window); i < idx; i++) {
    const v = days[i][field]
    if (v != null) vals.push(v)
  }
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

export function sleepScore(day) {
  const durationPart = clamp01(day.sleep.hours / 8) * 55
  const total = day.sleep.hours * 60
  const restorative = (day.sleep.stages.deep + day.sleep.stages.rem) / Math.max(1, total)
  const stagePart = clamp01(restorative / 0.42) * 30
  const continuityPart = clamp01(1 - day.sleep.stages.awake / Math.max(1, total) / 0.08) * 15
  return Math.round(durationPart + stagePart + continuityPart)
}

export function recoveryScore(days, idx) {
  const day = days[idx]
  const hrvBase = baseline(days, idx, 'hrv') ?? day.hrv
  const rhrBase = baseline(days, idx, 'rhr') ?? day.rhr
  // Calibrated so an at-baseline day with typical sleep lands ~62, good days
  // reach the 80s, and rough days dip under 55 (the readiness threshold).
  const hrvPart = clamp01(0.55 + (day.hrv - hrvBase) / (hrvBase * 0.25)) * 45
  const rhrPart = clamp01(0.55 - (day.rhr - rhrBase) / (rhrBase * 0.12)) * 30
  const sleepPart = (sleepScore(day) / 100) * 25
  return Math.round(hrvPart + rhrPart + sleepPart)
}

export function strainScore(day) {
  const sets = day.session
    ? day.session.exercises.reduce((s, ex) => s + ex.sets.length, 0)
    : 0
  const raw =
    clamp01(day.activeCal / 1100) * 45 +
    clamp01(day.zoneMinutes / 90) * 25 +
    clamp01(sets / 22) * 30
  return Math.round(raw)
}

export function stressScore(days, idx) {
  // 0 = calm, 100 = high physiological stress.
  const day = days[idx]
  const hrvBase = baseline(days, idx, 'hrv') ?? day.hrv
  const rhrBase = baseline(days, idx, 'rhr') ?? day.rhr
  const hrvDepression = clamp01((hrvBase - day.hrv) / (hrvBase * 0.25))
  const rhrElevation = clamp01((day.rhr - rhrBase) / (rhrBase * 0.12))
  const temp = clamp01(Math.abs(day.skinTempDelta) / 1.2)
  const sleepDebt = clamp01((7.5 - day.sleep.hours) / 2.5)
  return Math.round(hrvDepression * 40 + rhrElevation * 30 + temp * 10 + sleepDebt * 20)
}

export function scoreSeries(days, kind) {
  return days.map((d, i) => ({
    key: d.key,
    value:
      kind === 'recovery'
        ? recoveryScore(days, i)
        : kind === 'sleep'
          ? sleepScore(d)
          : kind === 'strain'
            ? strainScore(d)
            : stressScore(days, i),
  }))
}

// ---------- Readiness → training suggestion (cross-learning #1) ----------

export function readiness(days, plannedSplit) {
  const idx = days.length - 1
  const rec = recoveryScore(days, idx)
  const day = days[idx]
  const hrvBase = baseline(days, idx, 'hrv') ?? day.hrv
  const hrvDeltaPct = Math.round(((day.hrv - hrvBase) / hrvBase) * 100)
  if (!plannedSplit) {
    return {
      recovery: rec,
      tone: 'rest',
      title: `Recovery ${rec} — rest day`,
      detail: 'Nothing scheduled. Rest up.',
      hrvDeltaPct,
    }
  }
  if (rec < 55) {
    return {
      recovery: rec,
      tone: 'low',
      title: `Recovery ${rec} — take it easy`,
      detail: `HRV ${hrvDeltaPct}% vs baseline. Suggest −20% volume on today's ${plannedSplit}, or swap to a light pump session.`,
      hrvDeltaPct,
      volumeAdjustment: -0.2,
    }
  }
  if (rec > 80) {
    return {
      recovery: rec,
      tone: 'high',
      title: `Recovery ${rec} — green light for ${plannedSplit}`,
      detail: 'Optional +1 set on your first lift.',
      hrvDeltaPct,
      volumeAdjustment: 0,
      bonusSet: true,
    }
  }
  return {
    recovery: rec,
    tone: 'normal',
    title: `Recovery ${rec} — cleared for ${plannedSplit}`,
    detail: 'Run it as programmed.',
    hrvDeltaPct,
    volumeAdjustment: 0,
  }
}

// ---------- Muscle recovery (Arrow-style) ----------
// Fatigue from each set decays exponentially, ~48–72h to fresh.

const TAU_HOURS = 26

export function muscleRecoveryState(days, nowKey) {
  const now = keyToDate(nowKey).getTime() + 20 * 3600 * 1000
  const fatigue = {}
  for (const g of MUSCLE_GROUPS) fatigue[g] = 0
  for (const d of days) {
    if (!d.session) continue
    const t = keyToDate(d.key).getTime() + 18 * 3600 * 1000
    const ageH = (now - t) / 3600000
    if (ageH < 0 || ageH > 96) continue
    const decay = Math.exp(-ageH / TAU_HOURS)
    for (const ex of d.session.exercises) {
      for (const m of ex.muscles) {
        fatigue[m] += ex.sets.length * decay * (ex.muscles[0] === m ? 1 : 0.5)
      }
    }
  }
  return MUSCLE_GROUPS.map((g) => {
    const f = fatigue[g]
    const pct = Math.round(clamp01(f / 7) * 100)
    // Hours until fatigue decays under the "fresh" threshold (pct 25 → f 1.75)
    const freshAt = 0.25 * 7
    const hoursToFresh = f > freshAt ? Math.round(TAU_HOURS * Math.log(f / freshAt)) : 0
    return {
      muscle: g,
      fatiguePct: pct,
      status: pct > 55 ? 'fatigued' : pct > 25 ? 'recovering' : 'fresh',
      hoursToFresh,
    }
  })
}

// "Fresh now" / "~6h" / "tomorrow AM" — human label for a recovery ETA.
export function recoveryEta(hoursToFresh) {
  if (hoursToFresh <= 0) return 'Fresh now'
  if (hoursToFresh <= 12) return `~${hoursToFresh}h`
  const target = new Date(Date.now() + hoursToFresh * 3600 * 1000)
  const today = new Date()
  const dayDiff = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      DAY_MS,
  )
  const half = target.getHours() < 12 ? 'AM' : 'PM'
  if (dayDiff <= 0) return 'tonight'
  if (dayDiff === 1) return `tomorrow ${half}`
  return `${target.toLocaleDateString('en-US', { weekday: 'short' })} ${half}`
}

// Next 7 days of the split, each cross-checked against projected muscle
// recovery on that day (recovery → scheduling cross-learning).
export function upcomingSchedule(days, todayKey) {
  const out = []
  for (let i = 0; i < 7; i++) {
    const key = addDaysKey(todayKey, i)
    const dow = keyToDate(key).getDay()
    const template = dow === 0 ? null : ARNOLD_DAYS[(dow - 1) % 3]
    if (!template) {
      out.push({ key, name: 'Rest', ready: true, blockers: [] })
      continue
    }
    const primaries = [...new Set(template.exercises.map((ex) => EXERCISES[ex.name].muscles[0]))]
    const rec = muscleRecoveryState(days, key)
    const blockers = primaries.filter(
      (m) => rec.find((r) => r.muscle === m)?.status === 'fatigued',
    )
    out.push({ key, name: template.name, ready: blockers.length === 0, blockers })
  }
  return out
}

// ---------- Weekly volume per muscle group vs MEV–MRV band ----------

export function weeklyVolume(days, weeksBack = 0) {
  const end = days.length - 1 - weeksBack * 7
  const start = Math.max(0, end - 6)
  const sets = {}
  for (const g of MUSCLE_GROUPS) sets[g] = 0
  for (let i = start; i <= end && i < days.length; i++) {
    const s = days[i].session
    if (!s) continue
    for (const ex of s.exercises) {
      for (const m of ex.muscles) {
        sets[m] += ex.sets.length * (ex.muscles[0] === m ? 1 : 0.5)
      }
    }
  }
  return MUSCLE_GROUPS.map((g) => ({
    muscle: g,
    sets: Math.round(sets[g]),
    mev: VOLUME_BAND[g][0],
    mrv: VOLUME_BAND[g][1],
  }))
}

export function weeklySetTotals(days) {
  // Total working sets per ISO-ish week (7-day buckets from the end).
  const buckets = []
  for (let w = Math.floor(days.length / 7) - 1; w >= 0; w--) {
    const end = days.length - 1 - w * 7
    const start = end - 6
    let sets = 0
    for (let i = Math.max(0, start); i <= end; i++) {
      const s = days[i].session
      if (s) sets += s.exercises.reduce((n, ex) => n + ex.sets.length, 0)
    }
    buckets.push({ key: days[Math.max(0, start)].key, sets })
  }
  return buckets
}

// ---------- e1RM ----------

export function e1rm(load, reps, rir = 0) {
  return load * (1 + (reps + rir) / 30)
}

export function e1rmSeries(days) {
  const series = {}
  for (const lift of MAIN_LIFTS) series[lift] = []
  for (const d of days) {
    if (!d.session) continue
    for (const ex of d.session.exercises) {
      if (!MAIN_LIFTS.includes(ex.name)) continue
      const best = Math.max(...ex.sets.map((s) => e1rm(s.load, s.reps, s.rir)))
      series[ex.name].push({ key: d.key, e1rm: Math.round(best) })
    }
  }
  return series
}

// ---------- Session summary / XP ----------

export function sessionStats(session) {
  let volume = 0
  let sets = 0
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      volume += s.load * s.reps
      sets += 1
    }
  }
  return { volume: Math.round(volume), sets, xp: sets * 10 }
}

export function totalXP(days, bonusXP = 0) {
  let xp = 0
  for (const d of days) {
    if (d.session) xp += sessionStats(d.session).xp
  }
  return xp + bonusXP
}

export function currentStreak(days) {
  // Consecutive scheduled training days completed (rest days don't break it).
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]
    if (d.isToday && !d.session) continue // today doesn't break it until missed
    if (!d.plannedSplit) continue
    if (d.session) streak += 1
    else break
  }
  return streak
}

export function levelFromXP(xp) {
  const level = Math.floor(Math.sqrt(xp / 120)) + 1
  const currentFloor = 120 * (level - 1) ** 2
  const nextFloor = 120 * level ** 2
  return { level, progress: (xp - currentFloor) / (nextFloor - currentFloor) }
}

// ---------- Unified score (Stats hero) ----------

export function unifiedScore(days) {
  const idx = days.length - 1
  const rec = recoveryScore(days, idx)
  // Training consistency: completed / scheduled over last 28 days
  let scheduled = 0
  let done = 0
  for (let i = Math.max(0, idx - 27); i <= idx; i++) {
    if (days[i].plannedSplit && !days[i].isToday) {
      scheduled += 1
      if (days[i].session) done += 1
    }
  }
  const consistency = scheduled ? (done / scheduled) * 100 : 100
  // Nutrition adherence: days within ±10% of protein target, last 28 days
  let adherent = 0
  let counted = 0
  for (let i = Math.max(0, idx - 27); i <= idx; i++) {
    const p = days[i].intake?.protein
    if (p != null && !days[i].partial) {
      counted += 1
      if (Math.abs(p - 160) <= 16) adherent += 1
    }
  }
  const adherence = counted ? (adherent / counted) * 100 : 100
  const score = Math.round(consistency * 0.4 + adherence * 0.3 + rec * 0.3)
  return {
    score,
    consistency: Math.round(consistency),
    adherence: Math.round(adherence),
    recovery: rec,
  }
}
