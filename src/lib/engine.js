// ─────────────────────────────────────────────────────────────────────────
// The prescription engine: combines training history, HRV, sleep, energy
// balance and per-muscle recovery into concrete set targets, with a
// citation-backed rationale for every adjustment.
//
// Full methodology, assumptions and limitations: docs/ALGORITHM.md
// Every rule here is tagged with the study it leans on (see REFERENCES).
// This is a deterministic model — no ML, no black box: the same inputs
// always produce the same prescription and the same explanation.
// ─────────────────────────────────────────────────────────────────────────

// Training philosophy: LOW VOLUME, HIGH INTENSITY. A few hard sets taken
// close to failure, full recovery between them, progression through load —
// not through accumulating half-effort volume.

import { tdeeAt, muscleRecoveryState, weeklyVolume, e1rmSeries } from './derived'
import { EXERCISES, VOLUME_BAND, MAIN_LIFTS } from './programs'

export const REFERENCES = {
  epley1985: 'Epley B (1985). Poundage chart. Boyd Epley Workout.',
  zourdos2016:
    'Zourdos MC et al. (2016). Novel resistance training-specific RPE scale measuring repetitions in reserve. J Strength Cond Res 30(1).',
  helms2018:
    'Helms ER et al. (2018). Self-rated accuracy of RPE-based load prescription in powerlifters. J Strength Cond Res 32(10).',
  acsm2009:
    'ACSM (2009). Progression models in resistance training for healthy adults. Med Sci Sports Exerc 41(3).',
  plews2013:
    'Plews DJ et al. (2013). Training adaptation and heart rate variability in elite endurance athletes. Sports Med 43(9).',
  vesterinen2016:
    'Vesterinen V et al. (2016). Individual endurance training prescription with heart rate variability. Med Sci Sports Exerc 48(7).',
  craven2022:
    'Craven J et al. (2022). Effects of acute sleep loss on physical performance: a systematic and meta-analytical review. Sports Med 52.',
  knowles2018:
    'Knowles OE et al. (2018). Inadequate sleep and muscle strength: implications for resistance training. J Sci Med Sport 21(9).',
  murphy2022:
    'Murphy C & Koehler K (2022). Energy deficiency impairs resistance training gains in lean mass but not strength. Scand J Med Sci Sports 32(1).',
  helms2014:
    'Helms ER et al. (2014). Evidence-based recommendations for natural bodybuilding contest preparation. J Int Soc Sports Nutr 11:20.',
  damas2016:
    'Damas F et al. (2016). Resistance training-induced changes in integrated myofibrillar protein synthesis. J Physiol 594(18).',
  schoenfeld2017:
    'Schoenfeld BJ et al. (2017). Dose-response relationship between weekly resistance training volume and hypertrophy. J Sports Sci 35(11).',
  androulakis2020:
    'Androulakis-Korakakis P et al. (2020). The minimum effective training dose required to increase 1RM strength in resistance-trained men. Sports Med 50(4).',
  mangine2015:
    'Mangine GT et al. (2015). The effect of training volume and intensity on improvements in muscular strength and size in resistance-trained men. Physiol Rep 3(8).',
  refalo2023:
    'Refalo MC et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med 53(3).',
  iversen2021:
    'Iversen VM et al. (2021). No time to lift? Designing time-efficient training programs. Sports Med 51(10).',
  schoenfeld2016rest:
    'Schoenfeld BJ et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res 30(7).',
  meeusen2013:
    'Meeusen R et al. (2013). Prevention, diagnosis and treatment of the overtraining syndrome — ECSS/ACSM consensus statement. Med Sci Sports Exerc 45(1).',
}

// Rest between hard sets: longer rest preserves output on the next set
// (Schoenfeld 2016). Compounds get 3 min, isolation 2 min.
export function restSecondsFor(exName) {
  const meta = EXERCISES[exName]
  return meta?.main || meta?.equipment === 'barbell' ? 180 : 120
}

// Hard-set cap per exercise: top set + 1-2 back-offs. More than that is
// volume the philosophy says you don't need (Androulakis-Korakakis 2020).
export function setCapFor(exName) {
  const meta = EXERCISES[exName]
  return meta?.main || meta?.equipment === 'barbell' ? 3 : 2
}

// ── e1RM ──────────────────────────────────────────────────────────────────
// Epley with RIR-adjusted effective reps (Zourdos 2016): a set of 6 @ RIR 2
// is treated as an 8-rep max effort. Validity degrades past ~12 effective
// reps, so we cap the estimate's input there.
export function estimateE1RM(load, reps, rir = 0) {
  const effective = Math.min(12, reps + rir)
  return load * (1 + effective / 30)
}

// ── HRV readiness (Plews 2013; Vesterinen 2016) ──────────────────────────
// 7-day rolling mean compared to a 28-day baseline ± SWC, where the
// smallest worthwhile change is 0.5 × baseline SD. Inside the band =
// train as planned; below = reduce; above = cleared to push.
export function hrvReadiness(days, idx = days.length - 1) {
  const base = days.slice(Math.max(0, idx - 28), idx).map((d) => d.hrv)
  const roll = days.slice(Math.max(0, idx - 6), idx + 1).map((d) => d.hrv)
  if (base.length < 14 || !roll.length) return null
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const mu = mean(base)
  const sd = Math.sqrt(mean(base.map((v) => (v - mu) ** 2)))
  const swc = 0.5 * sd
  const rolling = mean(roll)
  const state = rolling < mu - swc ? 'low' : rolling > mu + swc ? 'high' : 'normal'
  return {
    state,
    rolling: Math.round(rolling),
    baseline: Math.round(mu),
    swc: Math.round(swc * 10) / 10,
  }
}

// ── Sleep (Craven 2022; Knowles 2018) ────────────────────────────────────
// Acute sleep loss costs ~3-8% of next-day performance depending on
// severity. We apply a conservative graded expectation, never > 4%.
export function sleepAdjustment(day) {
  const h = day.sleep.hours
  if (h < 6) return { pct: -0.04, note: `Slept ${fmtH(h)} — expect ~4% less on top sets` }
  if (h < 6.5) return { pct: -0.02, note: `Slept ${fmtH(h)} — slight strength dip likely` }
  return { pct: 0, note: `Slept ${fmtH(h)} — no adjustment` }
}

// ── Energy deficit (Murphy & Koehler 2022; Helms 2014) ───────────────────
// Strength is largely defensible in a moderate deficit; deep multi-day
// deficits (>~600 kcal/d) blunt training quality and recovery.
export function deficitAdjustment(days, idx = days.length - 1) {
  const tdee = tdeeAt(days, idx)
  if (tdee == null) return { pct: 0, note: null }
  let sum = 0
  let n = 0
  for (let j = Math.max(0, idx - 6); j <= idx; j++) {
    if (days[j].intake?.kcal != null && !days[j].partial) {
      sum += days[j].intake.kcal
      n += 1
    }
  }
  if (n < 5) return { pct: 0, note: null }
  const deficit = Math.round(tdee - sum / n)
  if (deficit > 600)
    return { pct: -0.025, note: `Deep deficit (~${deficit} kcal/d) — trimming load expectation` }
  if (deficit > 250)
    return { pct: 0, note: `Moderate deficit (~${deficit} kcal/d) — strength defensible` }
  return { pct: 0, note: `Near maintenance — full output available` }
}

// ── Day readiness: the combined gate ─────────────────────────────────────
export function dayReadiness(days, muscles = []) {
  const idx = days.length - 1
  const rationale = []
  let loadPct = 0
  let level = 'normal'

  const hrv = hrvReadiness(days, idx)
  if (hrv) {
    rationale.push({
      text: `HRV 7-day ${hrv.rolling} ms vs baseline ${hrv.baseline} ±${hrv.swc} — ${
        hrv.state === 'normal' ? 'within normal band' : hrv.state === 'low' ? 'below band' : 'above band'
      }`,
      ref: 'plews2013',
    })
    if (hrv.state === 'low') {
      loadPct -= 0.025
      level = 'hold'
    } else if (hrv.state === 'high') {
      level = 'push'
    }
  }

  const sleep = sleepAdjustment(days[idx])
  rationale.push({ text: sleep.note, ref: 'craven2022' })
  loadPct += sleep.pct
  if (sleep.pct <= -0.04) level = 'back-off'
  else if (sleep.pct < 0 && level === 'push') level = 'normal'

  const deficit = deficitAdjustment(days, idx)
  if (deficit.note) rationale.push({ text: deficit.note, ref: 'murphy2022' })
  loadPct += deficit.pct

  if (muscles.length) {
    const rec = muscleRecoveryState(days, days[idx].key)
    const fatigued = muscles.filter(
      (m) => rec.find((r) => r.muscle === m)?.status === 'fatigued',
    )
    if (fatigued.length) {
      rationale.push({
        text: `${fatigued.join(', ')} still carrying fatigue from the last session`,
        ref: 'damas2016',
      })
      if (level !== 'back-off') level = 'hold'
    } else {
      rationale.push({ text: `Target muscles recovered (48-72h decay complete)`, ref: 'damas2016' })
    }

    // Volume advisor: above the effective band → trim sets, keep effort
    const vol = weeklyVolume(days)
    const over = muscles.filter((m) => {
      const v = vol.find((x) => x.muscle === m)
      return v && v.sets > (VOLUME_BAND[m]?.[1] ?? 99)
    })
    if (over.length) {
      rationale.push({
        text: `${over.join(', ')} above the effective band last week — fewer sets, harder sets`,
        ref: 'androulakis2020',
      })
    }
  }

  // Deload check: main-lift e1RM flat-or-down while HRV sits below band
  if (hrv?.state === 'low') {
    const series = e1rmSeries(days)
    const stalled = MAIN_LIFTS.filter((l) => {
      const pts = series[l]
      if (pts.length < 6) return false
      const recent = pts.slice(-3).reduce((s, p) => s + p.e1rm, 0) / 3
      const prior = pts.slice(-6, -3).reduce((s, p) => s + p.e1rm, 0) / 3
      return recent <= prior
    })
    if (stalled.length >= 3) {
      level = 'back-off'
      rationale.push({
        text: 'Lifts stalling with HRV suppressed — take a lighter week',
        ref: 'meeusen2013',
      })
    }
  }

  return { level, loadPct: Math.max(-0.06, loadPct), rationale }
}

// ── Per-exercise prescription ────────────────────────────────────────────
// High-intensity double progression (ACSM 2009; Helms 2018; Refalo 2023):
// work lives at RIR 0-2, and progression comes through load.
//   · last top set left ≥2 RIR            → load up ~2.5% (too easy)
//   · hit target reps at RIR ≥1           → load up one plate step
//   · missed reps by 2+ at RIR 0          → hold and consolidate
//   · otherwise                           → same load, chase +1 rep
// The day-readiness modifier then scales or vetoes the increase; a
// high-readiness day means take the top set to RIR 0, not more sets.
export function prescribeExercise(days, exName, targetReps, day) {
  const meta = EXERCISES[exName]
  const inc = meta?.increment || 2.5
  // Most recent session containing this exercise
  let last = null
  for (let i = days.length - 2; i >= 0 && !last; i--) {
    const found = days[i].session?.exercises.find((e) => e.name === exName)
    if (found?.sets.length) last = found
  }
  if (!last) {
    return {
      load: meta?.defaultLoad ?? 0,
      reps: targetReps,
      rir: 1,
      change: 'first log',
      rationale: [{ text: 'No history yet — starting from the library default', ref: 'acsm2009' }],
    }
  }
  const top = last.sets.reduce((a, b) => (estimateE1RM(b.load, b.reps, b.rir) > estimateE1RM(a.load, a.reps, a.rir) ? b : a))
  const e1rm = Math.round(estimateE1RM(top.load, top.reps, top.rir))
  const rationale = [
    {
      text: `Last time: ${top.reps}×${top.load} @RIR ${top.rir} → e1RM ${e1rm} lb`,
      ref: 'zourdos2016',
    },
  ]

  let load = top.load
  let reps = targetReps
  let change = 'hold'
  const targetRir = day?.level === 'push' ? 0 : 1
  if (top.rir >= 2) {
    const step = Math.max(inc, Math.round((top.load * 0.025) / inc) * inc)
    load = top.load + step
    change = `+${step} lb`
    rationale.push({ text: `${top.rir} reps left in the tank — that set was too easy. Load up ~2.5%`, ref: 'refalo2023' })
  } else if (top.reps >= targetReps && top.rir >= 1) {
    load = top.load + inc
    change = `+${inc} lb`
    rationale.push({ text: `Hit ${targetReps} reps near failure — progress one step`, ref: 'acsm2009' })
  } else if (top.reps <= targetReps - 2 && top.rir === 0) {
    change = 'hold'
    rationale.push({ text: `True failure short of target — consolidate before adding load`, ref: 'acsm2009' })
  } else {
    change = '+1 rep'
    reps = top.reps + 1
    rationale.push({ text: `Same load, one more rep at the same effort`, ref: 'acsm2009' })
  }
  if (day?.level === 'push') {
    rationale.push({ text: 'Recovery above band — take the top set to RIR 0', ref: 'refalo2023' })
  }

  // Readiness veto/scale
  if (day) {
    if (day.level === 'back-off') {
      const stripped = Math.round((top.load * 0.95) / inc) * inc
      if (stripped < load) {
        load = stripped
        change = `−${top.load - stripped} lb`
        rationale.push({ text: 'Rough recovery day — strip ~5% and keep quality', ref: 'craven2022' })
      }
    } else if (day.level === 'hold' && load > top.load) {
      load = top.load
      change = 'hold'
      rationale.push({ text: 'Readiness below band — bank the progression for next time', ref: 'vesterinen2016' })
    } else if (day.loadPct < -0.02 && load > top.load) {
      load = top.load
      change = 'hold'
    }
  }

  return { load, reps, rir: targetRir, change, e1rm, rationale }
}

function fmtH(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}
