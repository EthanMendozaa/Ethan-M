// Simulated Health Connect sync: runs automatically on every app open,
// re-runs on demand (tap the pill or pull-to-refresh on the dashboard).

import { useCallback, useEffect, useRef, useState } from 'react'

const STEPS = ['Heart rate', 'HRV', 'Sleep stages', 'Steps', 'Calories', 'SpO2', 'Weight']
const STEP_MS = 300

export function useHealthSync() {
  const [state, setState] = useState({ status: 'idle', step: STEPS[0], justSynced: false })
  const timers = useRef([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const resync = useCallback(() => {
    clear()
    setState({ status: 'syncing', step: STEPS[0], justSynced: false })
    STEPS.forEach((step, i) => {
      timers.current.push(setTimeout(() => setState((s) => ({ ...s, step })), i * STEP_MS))
    })
    timers.current.push(
      setTimeout(
        () => setState({ status: 'done', step: null, justSynced: true }),
        STEPS.length * STEP_MS + 200,
      ),
    )
    timers.current.push(
      setTimeout(
        () => setState((s) => ({ ...s, justSynced: false })),
        STEPS.length * STEP_MS + 1600,
      ),
    )
  }, [])

  // Auto-sync on app open
  useEffect(() => {
    resync()
    return clear
  }, [resync])

  return { ...state, resync }
}
