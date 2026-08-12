// App state: deterministic seed world + user mutations overlaid.
// Only the user's own actions persist (localStorage); the seed regenerates
// on every load, anchored to today, so the demo never looks stale.

import { createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import { generateSeedWorld, plannedSessionFor, SEED_VERSION } from './seed'
import { todayKey } from './dates'

const STORAGE_KEY = `fitmock.v${SEED_VERSION}`

const defaultUserState = {
  weighIns: {}, // { 'YYYY-MM-DD': lb }
  extraMeals: {}, // { 'YYYY-MM-DD': [mealItem] }
  foodEdits: {}, // { 'YYYY-MM-DD': { [itemUid]: { mult?, removed?, moveTo? } } }
  activities: {}, // { 'YYYY-MM-DD': [{ type, minutes, kcal }] }
  completedSession: null, // { key, session } — today's logged workout
  bonusXP: 0,
  activeProgramId: 'arnold-split',
  settings: { units: 'lb', notifications: true },
}

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'logged']
const SLOT_TIMES = {
  breakfast: '7:40 AM',
  lunch: '12:30 PM',
  dinner: '7:15 PM',
  snack: '9:30 PM',
  logged: 'Just now',
}

function makeItem(uid, raw, mult) {
  return {
    uid,
    name: raw.name,
    fiber: raw.fiber,
    mult,
    base: { kcal: raw.kcal, p: raw.p, c: raw.c, f: raw.f },
    kcal: Math.round(raw.kcal * mult),
    p: Math.round(raw.p * mult),
    c: Math.round(raw.c * mult),
    f: Math.round(raw.f * mult),
  }
}

// Rebuild a day's meals with stable per-item uids, applying the user's
// portion/move/remove edits and appending quick-added items.
function rebuildMeals(day, extras, edits) {
  const buckets = {}
  const push = (slot, item) => (buckets[slot] ??= []).push(item)
  for (const meal of day.meals) {
    meal.items.forEach((raw, idx) => {
      const uid = `${meal.slot}:${idx}`
      const e = edits[uid]
      if (e?.removed) return
      push(e?.moveTo ?? meal.slot, makeItem(uid, raw, e?.mult ?? 1))
    })
  }
  extras.forEach((raw, idx) => {
    const uid = `logged:${idx}`
    const e = edits[uid]
    if (e?.removed) return
    push(e?.moveTo ?? 'logged', makeItem(uid, raw, e?.mult ?? 1))
  })
  const meals = SLOT_ORDER.filter((s) => buckets[s]?.length).map((slot) => {
    const items = buckets[slot]
    const sum = (f) => items.reduce((s, it) => s + it[f], 0)
    const orig = day.meals.find((m) => m.slot === slot)
    return {
      slot,
      time: orig?.time ?? SLOT_TIMES[slot],
      items,
      kcal: sum('kcal'),
      p: sum('p'),
      c: sum('c'),
      f: sum('f'),
    }
  })
  return {
    meals,
    intake: {
      kcal: meals.reduce((s, m) => s + m.kcal, 0),
      protein: meals.reduce((s, m) => s + m.p, 0),
      carbs: meals.reduce((s, m) => s + m.c, 0),
      fat: meals.reduce((s, m) => s + m.f, 0),
    },
  }
}

function loadUserState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultUserState
    const parsed = JSON.parse(raw)
    // A logged workout from a previous calendar day belongs to the seed's past
    // now — drop it rather than pinning it to the wrong "today".
    if (parsed.completedSession && parsed.completedSession.key !== todayKey()) {
      parsed.completedSession = null
    }
    return { ...defaultUserState, ...parsed }
  } catch {
    return defaultUserState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'addWeighIn':
      return { ...state, weighIns: { ...state.weighIns, [action.key]: action.weightLb } }
    case 'addFood': {
      const list = state.extraMeals[action.key] ?? []
      return {
        ...state,
        extraMeals: { ...state.extraMeals, [action.key]: [...list, action.item] },
      }
    }
    case 'editFood': {
      const dayEdits = state.foodEdits[action.key] ?? {}
      return {
        ...state,
        foodEdits: {
          ...state.foodEdits,
          [action.key]: {
            ...dayEdits,
            [action.uid]: { ...dayEdits[action.uid], ...action.change },
          },
        },
      }
    }
    case 'logActivity': {
      const list = state.activities[action.key] ?? []
      return {
        ...state,
        activities: { ...state.activities, [action.key]: [...list, action.activity] },
      }
    }
    case 'completeWorkout':
      return {
        ...state,
        completedSession: { key: action.key, session: action.session },
        bonusXP: state.bonusXP + (action.bonusXP ?? 0),
      }
    case 'setProgram':
      return { ...state, activeProgramId: action.programId }
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'reset':
      return defaultUserState
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [userState, dispatch] = useReducer(reducer, undefined, loadUserState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userState))
    } catch {
      // localStorage unavailable (private mode) — demo still works in memory
    }
  }, [userState])

  const anchor = todayKey()
  const world = useMemo(() => generateSeedWorld(anchor), [anchor])

  // Merge user mutations into the seeded days.
  const days = useMemo(() => {
    return world.days.map((d) => {
      let out = d
      const w = userState.weighIns[d.key]
      if (w != null) out = { ...out, weightLb: w }
      // Meals always rebuilt with stable uids so log entries are editable
      out = {
        ...out,
        ...rebuildMeals(d, userState.extraMeals[d.key] ?? [], userState.foodEdits[d.key] ?? {}),
      }
      const acts = userState.activities[d.key]
      if (acts?.length) {
        out = {
          ...out,
          activeCal: out.activeCal + acts.reduce((s, a) => s + a.kcal, 0),
          zoneMinutes: out.zoneMinutes + acts.reduce((s, a) => s + Math.round(a.minutes * 0.7), 0),
        }
      }
      if (userState.completedSession?.key === d.key) {
        out = { ...out, session: userState.completedSession.session }
      }
      return out
    })
  }, [world, userState])

  const value = useMemo(
    () => ({
      days,
      todayKey: anchor,
      today: days[days.length - 1],
      plannedSession: plannedSessionFor(world, anchor),
      userState,
      dispatch,
      resetDemo: () => {
        dispatch({ type: 'reset' })
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
      },
    }),
    [days, world, anchor, userState],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
