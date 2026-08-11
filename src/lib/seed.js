// Deterministic 90-day demo world for one persona:
// male, 5'10", cutting ~158 → ~146 lb on ~2,050 kcal, Arnold split 6 days/week,
// ~15k steps/day. Everything is generated from energy balance + simple rules so
// the derived metrics (trend weight, TDEE, insights) are coherent by construction.
//
// Baked-in correlations (the Stats screen *computes* these back out of the data):
//  1. Nights under 6.5h sleep → next-day top-set loads ×0.93 (~7% drop)
//  2. Training block 2 (last ~6 weeks) adds sets → true expenditure +140 kcal
//  3. Protein stays near the 160g target → strength holds while cutting
//  4. Deeper 7-day energy deficit → slightly depressed HRV

import { mulberry32, makeNoise } from './prng'
import { todayKey, addDays, keyToDate } from './dates'
import { ARNOLD_DAYS, EXERCISES } from './programs'

export const SEED_VERSION = 1
const DAYS = 90
const START_WEIGHT = 158.0
const PROTEIN_TARGET = 160
const BLOCK2_START = 45 // day index where the higher-volume block begins

const FOODS = {
  breakfast: [
    { name: 'Greek yogurt + berries', kcal: 220, p: 22, c: 26, f: 3 },
    { name: '3 eggs, scrambled', kcal: 210, p: 18, c: 2, f: 15 },
    { name: 'Oatmeal w/ banana', kcal: 280, p: 8, c: 54, f: 5 },
  ],
  lunch: [
    { name: 'Chicken burrito bowl', kcal: 620, p: 46, c: 68, f: 18 },
    { name: 'Turkey club wrap', kcal: 540, p: 38, c: 52, f: 20 },
  ],
  dinner: [
    { name: 'Salmon, rice & greens', kcal: 700, p: 48, c: 62, f: 26 },
    { name: 'Steak, potatoes & salad', kcal: 760, p: 52, c: 58, f: 32 },
    { name: 'Chicken thigh stir-fry', kcal: 650, p: 45, c: 60, f: 22 },
  ],
  snack: [
    { name: 'Whey shake', kcal: 180, p: 32, c: 6, f: 3 },
    { name: 'Protein bar', kcal: 210, p: 20, c: 22, f: 7 },
    { name: 'Cottage cheese', kcal: 160, p: 24, c: 8, f: 4 },
  ],
}

const MEAL_TIMES = { breakfast: '7:40 AM', lunch: '12:30 PM', dinner: '7:15 PM', snack: '9:30 PM' }

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function roundLoad(load, increment) {
  if (!increment) return 0
  return Math.round(load / increment) * increment
}

// Which Arnold day (or null = rest) falls on a given date. Sunday rests.
export function scheduledSplitDay(key) {
  const dow = keyToDate(key).getDay() // 0 = Sunday
  if (dow === 0) return null
  return ARNOLD_DAYS[(dow - 1) % 3]
}

function buildMeals(rand, noise, isWeekend, upToMeal = null) {
  const order = ['breakfast', 'lunch', 'dinner', 'snack']
  const meals = []
  for (const slot of order) {
    if (upToMeal && order.indexOf(slot) > order.indexOf(upToMeal)) break
    const qty = 0.92 + rand() * 0.3
    const items = []
    if (slot === 'breakfast') {
      items.push(pick(rand, FOODS.breakfast), FOODS.breakfast[0])
    } else {
      items.push(pick(rand, FOODS[slot]))
    }
    if (slot === 'dinner' && isWeekend && rand() > 0.4) {
      items.push({ name: 'Ice cream (weekend)', kcal: 310, p: 5, c: 38, f: 16 })
    }
    const scaled = items.map((it) => ({
      name: it.name,
      kcal: Math.round(it.kcal * qty),
      p: Math.round(it.p * qty),
      c: Math.round(it.c * qty),
      f: Math.round(it.f * qty),
    }))
    meals.push({
      slot,
      time: MEAL_TIMES[slot],
      items: scaled,
      kcal: scaled.reduce((s, it) => s + it.kcal, 0),
      p: scaled.reduce((s, it) => s + it.p, 0),
      c: scaled.reduce((s, it) => s + it.c, 0),
      f: scaled.reduce((s, it) => s + it.f, 0),
    })
  }
  return meals
}

function mealTotals(meals) {
  return {
    kcal: meals.reduce((s, m) => s + m.kcal, 0),
    protein: meals.reduce((s, m) => s + m.p, 0),
    carbs: meals.reduce((s, m) => s + m.c, 0),
    fat: meals.reduce((s, m) => s + m.f, 0),
  }
}

function buildSession(rand, noise, template, dayIndex, lowSleep, progressions) {
  const inBlock2 = dayIndex >= BLOCK2_START
  const exercises = template.exercises.map((ex, exIdx) => {
    const meta = EXERCISES[ex.name]
    const prog = progressions[ex.name]
    // Slow linear progression despite the cut (+~3% across the block),
    // knocked down ~7% on the day after a short night.
    const progressFactor = 1 + prog.sessions * 0.0011
    const sleepFactor = lowSleep && exIdx < 2 ? 0.93 : 1
    const baseLoad = ex.startLoad * progressFactor * sleepFactor
    const sets = ex.sets + (inBlock2 && exIdx < 3 ? 1 : 0)
    const setList = []
    for (let s = 0; s < sets; s++) {
      const backoff = s === 0 ? 1 : 1 - 0.04 * s
      const load = roundLoad(baseLoad * backoff, meta.increment || 2.5)
      const reps = Math.max(3, Math.round(ex.reps + noise(0, 1.2) - s * 0.4))
      const rir = Math.max(0, Math.min(4, Math.round(1 + s * 0.5 + noise(0, 0.8))))
      setList.push({ reps, load, rir })
    }
    prog.sessions += 1
    return { name: ex.name, muscles: meta.muscles, sets: setList }
  })
  return { dayName: template.name, exercises, completed: true }
}

export function generateSeedWorld(anchorKey = todayKey()) {
  const rand = mulberry32(0xf17e55)
  const noise = makeNoise(rand)
  const startKey = addDays(anchorKey, -(DAYS - 1))

  const progressions = {}
  for (const name of Object.keys(EXERCISES)) progressions[name] = { sessions: 0 }

  const days = []
  let trueWeight = START_WEIGHT
  let prevSleepLow = false
  let prevDeficit = 420

  for (let i = 0; i < DAYS; i++) {
    const key = addDays(startKey, i)
    const date = keyToDate(key)
    const dow = date.getDay()
    const isWeekend = dow === 6 || dow === 0
    const isToday = i === DAYS - 1

    // --- Nutrition (meals first; daily totals are their sum) ---
    const meals = buildMeals(rand, noise, isWeekend, isToday ? 'lunch' : null)
    const intake = mealTotals(meals)

    // --- True expenditure (hidden ground truth driving the weight curve) ---
    const tdeeTruth = (i < BLOCK2_START ? 2480 : 2620) + noise(0, 35)

    // --- Sleep ---
    // Explicit short-night events (~1 in 6) so the sleep→performance
    // correlation actually exists in the data; normal nights stay ≥ 6.6h.
    const shortNight = rand() < 0.16
    const sleepHours = shortNight
      ? 5.5 + rand() * 0.9
      : Math.max(6.6, Math.min(8.8, 7.4 + noise(0, 0.8)))
    const lowSleep = sleepHours < 6.5
    const sleepScoreRaw = Math.round(
      Math.max(30, Math.min(98, (sleepHours / 8) * 78 + noise(12, 6))),
    )

    // --- Training ---
    const template = scheduledSplitDay(key)
    let session = null
    if (template && !isToday) {
      session = buildSession(rand, noise, template, i, prevSleepLow, progressions)
    }

    // --- Energy balance → weight ---
    if (!isToday) {
      trueWeight -= (tdeeTruth - intake.kcal) / 3500
    }
    const scaleWeight = Math.round((trueWeight + noise(0, 0.9)) * 10) / 10

    // --- Wearable vitals ---
    // Morning HRV reflects *yesterday's* energy deficit (today's log is partial).
    const deficitPenalty = Math.max(0, (prevDeficit - 250) / 60)
    const legDay = template?.name === 'Legs'
    const hrv = Math.round(
      Math.max(
        38,
        68 + noise(0, 5) - (prevSleepLow ? 5 : 0) - (legDay ? 3 : 0) - deficitPenalty,
      ),
    )
    const rhr = Math.round(52 + (68 - hrv) * 0.3 + noise(0, 1.4))
    const steps = Math.max(
      4000,
      Math.round(dow === 0 ? 9000 + noise(0, 1800) : 15000 + noise(0, 2400)),
    )
    const activeCal = Math.round(tdeeTruth - 1760 + noise(0, 40))
    const zoneMinutes = Math.round(
      (template ? 42 : 18) + steps / 900 + noise(0, 8),
    )
    const stages = {
      deep: Math.round(sleepHours * 60 * (0.17 + noise(0, 0.02))),
      rem: Math.round(sleepHours * 60 * (0.21 + noise(0, 0.02))),
      awake: Math.round(sleepHours * 60 * 0.05),
    }
    stages.light = Math.round(sleepHours * 60) - stages.deep - stages.rem - stages.awake

    days.push({
      key,
      dayIndex: i,
      isToday,
      partial: isToday, // today's food log is incomplete — TDEE math skips it
      weightLb: isToday ? null : scaleWeight, // today's weigh-in is the user's job
      bodyFatPct: Math.round((15.2 - i * 0.029 + noise(0, 0.15)) * 10) / 10,
      intake,
      meals,
      sleep: {
        hours: Math.round(sleepHours * 100) / 100,
        stages,
        scoreRaw: sleepScoreRaw,
        bedtime: `${10 + (noise(0, 0.7) > 0.35 ? 1 : 0)}:${rand() > 0.5 ? '48' : '12'} PM`,
      },
      hrv,
      rhr,
      spo2: Math.round((96.8 + noise(0, 0.7)) * 10) / 10,
      respRate: Math.round((14.3 + noise(0, 0.5)) * 10) / 10,
      skinTempDelta: Math.round(noise(prevSleepLow ? 0.3 : 0, 0.3) * 10) / 10,
      vo2max: Math.round((46.5 + i * 0.02 + noise(0, 0.3)) * 10) / 10,
      steps,
      activeCal,
      totalCal: Math.round(tdeeTruth),
      zoneMinutes,
      session,
      plannedSplit: template ? template.name : null,
    })
    prevSleepLow = lowSleep
    prevDeficit = tdeeTruth - intake.kcal
  }

  return { seedVersion: SEED_VERSION, anchorKey, startKey, days }
}

// Today's planned session with ghost values from the most recent matching session.
export function plannedSessionFor(world, key) {
  const template = scheduledSplitDay(key)
  if (!template) return null
  const lastMatching = [...world.days]
    .reverse()
    .find((d) => d.session && d.session.dayName === template.name)
  return {
    dayName: template.name,
    exercises: template.exercises.map((ex, idx) => {
      const meta = EXERCISES[ex.name]
      const prev = lastMatching?.session.exercises.find((e) => e.name === ex.name)
      return {
        name: ex.name,
        muscles: meta.muscles,
        targetSets: ex.sets + 1 * (idx < 3 ? 1 : 0), // block-2 volume
        targetReps: ex.reps,
        prevSets: prev ? prev.sets : null,
        increment: meta.increment,
      }
    }),
  }
}
