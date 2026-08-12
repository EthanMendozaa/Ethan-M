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
  activities: {}, // { 'YYYY-MM-DD': [{ type, minutes, kcal }] }
  completedSession: null, // { key, session } — today's logged workout
  bonusXP: 0,
  activeProgramId: 'arnold-split',
  settings: { units: 'lb', notifications: true },
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
      const extras = userState.extraMeals[d.key]
      if (extras?.length) {
        const extraMeal = {
          slot: 'logged',
          time: 'Just now',
          items: extras,
          kcal: extras.reduce((s, it) => s + it.kcal, 0),
          p: extras.reduce((s, it) => s + it.p, 0),
          c: extras.reduce((s, it) => s + it.c, 0),
          f: extras.reduce((s, it) => s + it.f, 0),
        }
        out = {
          ...out,
          meals: [...out.meals, extraMeal],
          intake: {
            kcal: out.intake.kcal + extraMeal.kcal,
            protein: out.intake.protein + extraMeal.p,
            carbs: out.intake.carbs + extraMeal.c,
            fat: out.intake.fat + extraMeal.f,
          },
        }
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
