// Stats-screen insight cards. Each is COMPUTED from the day records — the
// numbers in the copy come out of the data, and a card returns null when the
// data doesn't actually support it.

import { tdeeAt, e1rmSeries, weeklySetTotals } from './derived'
import { MAIN_LIFTS } from './programs'

// 1. Short sleep → next-day top-set performance.
export function sleepPerformanceInsight(days) {
  const ratios = { low: [], normal: [] }
  const byLift = {}
  for (let i = 1; i < days.length; i++) {
    const s = days[i].session
    if (!s) continue
    const lowSleep = days[i - 1].sleep.hours < 6.5
    for (const ex of s.exercises) {
      if (!MAIN_LIFTS.includes(ex.name)) continue
      const top = Math.max(...ex.sets.map((t) => t.load))
      ;(byLift[ex.name] ??= []).push({ top, lowSleep })
    }
  }
  for (const occurrences of Object.values(byLift)) {
    for (let j = 1; j < occurrences.length - 1; j++) {
      const expected = (occurrences[j - 1].top + occurrences[j + 1].top) / 2
      if (!expected) continue
      const ratio = occurrences[j].top / expected
      ;(occurrences[j].lowSleep ? ratios.low : ratios.normal).push(ratio)
    }
  }
  if (ratios.low.length < 3 || ratios.normal.length < 5) return null
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const dropPct = Math.round((1 - mean(ratios.low) / mean(ratios.normal)) * 1000) / 10
  if (dropPct < 2) return null
  return {
    id: 'sleep-performance',
    tag: 'Sleep → Training',
    title: `Nights under 6.5h → top-set loads drop ~${dropPct}%`,
    detail: `Across ${ratios.low.length} short-sleep nights this block, your main-lift top sets came in ${dropPct}% below the surrounding sessions. Guard the night before heavy days.`,
    stat: `−${dropPct}%`,
  }
}

// 2. Training volume ramp → expenditure ramp.
export function volumeExpenditureInsight(days) {
  const weeks = weeklySetTotals(days)
  if (weeks.length < 8) return null
  const firstBlock = weeks.slice(0, 4)
  const lastBlock = weeks.slice(-4)
  const mean = (a) => a.reduce((s, w) => s + w.sets, 0) / a.length
  const v1 = mean(firstBlock)
  const v2 = mean(lastBlock)
  const volumeDeltaPct = Math.round(((v2 - v1) / v1) * 100)
  const tdeeEarly = tdeeAt(days, 34)
  const tdeeNow = tdeeAt(days, days.length - 1)
  if (tdeeEarly == null || tdeeNow == null) return null
  const kcalDelta = Math.round((tdeeNow - tdeeEarly) / 10) * 10
  if (volumeDeltaPct < 5 || kcalDelta < 40) return null
  return {
    id: 'volume-expenditure',
    tag: 'Training → Nutrition',
    title: `Training volume +${volumeDeltaPct}% this block → expenditure +${kcalDelta} kcal`,
    detail: `Weekly sets went from ~${Math.round(v1)} to ~${Math.round(v2)}, and your estimated TDEE rose from ${tdeeEarly.toLocaleString()} to ${tdeeNow.toLocaleString()} kcal. Your calorie targets already account for it.`,
    stat: `+${kcalDelta} kcal`,
  }
}

// 3. Protein adherence while cutting → strength retention.
export function proteinStrengthInsight(days) {
  let adherent = 0
  let counted = 0
  for (const d of days) {
    const p = d.intake?.protein
    if (p != null && !d.partial) {
      counted += 1
      if (Math.abs(p - 160) <= 16) adherent += 1
    }
  }
  if (!counted) return null
  const adherencePct = Math.round((adherent / counted) * 100)
  const series = e1rmSeries(days)
  const slopes = []
  for (const lift of MAIN_LIFTS) {
    const pts = series[lift]
    if (pts.length < 6) continue
    const first = pts.slice(0, 3).reduce((s, p_) => s + p_.e1rm, 0) / 3
    const last = pts.slice(-3).reduce((s, p_) => s + p_.e1rm, 0) / 3
    slopes.push((last - first) / first)
  }
  if (!slopes.length) return null
  const meanSlopePct = Math.round((slopes.reduce((s, v) => s + v, 0) / slopes.length) * 1000) / 10
  if (adherencePct < 75 || meanSlopePct < -2) return null
  const strengthWord = meanSlopePct >= 1 ? `up ${meanSlopePct}%` : 'holding steady'
  return {
    id: 'protein-strength',
    tag: 'Nutrition → Training',
    title: `Protein adherence ${adherencePct}% during the cut → strength ${strengthWord}`,
    detail: `You hit within 10% of your 160g protein target on ${adherencePct}% of logged days, and average main-lift e1RM is ${meanSlopePct >= 0 ? '+' : ''}${meanSlopePct}% across the block — while losing weight.`,
    stat: `${adherencePct}%`,
  }
}

// 4. Deficit depth → HRV (recovery cost of dieting hard).
export function deficitHrvInsight(days) {
  const rows = []
  for (let i = 20; i < days.length; i++) {
    const tdee = tdeeAt(days, i)
    if (tdee == null) continue
    let intakeSum = 0
    let n = 0
    for (let j = i - 6; j <= i; j++) {
      if (days[j].intake?.kcal != null && !days[j].partial) {
        intakeSum += days[j].intake.kcal
        n += 1
      }
    }
    if (n < 5) continue
    rows.push({ deficit: tdee - intakeSum / n, hrv: days[i].hrv })
  }
  if (rows.length < 20) return null
  const sorted = [...rows].sort((a, b) => a.deficit - b.deficit)
  const shallow = sorted.slice(0, Math.floor(sorted.length / 3))
  const deep = sorted.slice(-Math.floor(sorted.length / 3))
  const mean = (a, f) => a.reduce((s, r) => s + f(r), 0) / a.length
  const hrvGap = Math.round(mean(shallow, (r) => r.hrv) - mean(deep, (r) => r.hrv))
  if (hrvGap < 2) return null
  const deepAvg = Math.round(mean(deep, (r) => r.deficit) / 10) * 10
  return {
    id: 'deficit-hrv',
    tag: 'Nutrition → Recovery',
    title: `Deficits near ${deepAvg} kcal run HRV ~${hrvGap} ms lower`,
    detail: `Your deepest-deficit days average ${hrvGap} ms less HRV than your shallowest. Expected while cutting — one reason recovery gates your training suggestions.`,
    stat: `−${hrvGap} ms`,
  }
}

export function allInsights(days) {
  return [
    sleepPerformanceInsight(days),
    volumeExpenditureInsight(days),
    proteinStrengthInsight(days),
    deficitHrvInsight(days),
  ].filter(Boolean)
}
