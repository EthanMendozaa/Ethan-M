// First-open onboarding: sign in → about you → activity → goal → split →
// calorie plan (computed via Mifflin RMR × activity − deficit) → connect
// Health Connect → done. Cosmetic auth, real math, answers persist.

import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { estimateRMR } from '../lib/engine'
import { PROGRAMS } from '../lib/programs'

const ACTIVITY = [
  { id: 'sedentary', label: 'Mostly sitting', desc: '< 6k steps/day', factor: 1.35 },
  { id: 'light', label: 'Lightly active', desc: '6-10k steps/day', factor: 1.55 },
  { id: 'active', label: 'Active', desc: '10-15k steps/day', factor: 1.75 },
  { id: 'athlete', label: 'Very active', desc: '15k+ steps/day', factor: 1.95 },
]

const GOALS = [
  { id: 'cut', label: 'Lose fat', emoji: '🔥', desc: 'Keep strength, drop weight' },
  { id: 'maintain', label: 'Maintain', emoji: '⚖️', desc: 'Recomp at current weight' },
  { id: 'bulk', label: 'Build muscle', emoji: '💪', desc: 'Lean surplus, slow gain' },
]

function Stepper({ value, onChange, step = 1, min = 0, max = 999, format = (v) => v }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-[19px] text-ink-2 active:scale-90 transition-transform"
      >
        −
      </button>
      <span className="w-24 text-center text-[26px] font-bold text-ink">{format(value)}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-[19px] text-ink-2 active:scale-90 transition-transform"
      >
        +
      </button>
    </div>
  )
}

export default function Onboarding() {
  const { dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [sex, setSex] = useState('m')
  const [age, setAge] = useState(27)
  const [heightIn, setHeightIn] = useState(70)
  const [weightLb, setWeightLb] = useState(147)
  const [activity, setActivity] = useState('active')
  const [goal, setGoal] = useState('cut')
  const [goalWeight, setGoalWeight] = useState(145)
  const [programId, setProgramId] = useState('arnold-split')
  const [plan, setPlan] = useState('recommended')
  const [health, setHealth] = useState('idle') // idle | connecting | connected

  const TOTAL = 7

  const calorieOptions = useMemo(() => {
    const rmr = estimateRMR(weightLb, { heightCm: heightIn * 2.54, age, sex })
    const factor = ACTIVITY.find((a) => a.id === activity)?.factor ?? 1.75
    const tdee = Math.round((rmr * factor) / 10) * 10
    const rate = (pct) => Math.round((tdee + ((-pct * weightLb * 3500) / 100) / 7) / 10) * 10
    const lb = (pct) => Math.round(((pct * weightLb) / 100) * 100) / 100
    if (goal === 'maintain')
      return {
        tdee,
        options: [{ id: 'recommended', label: 'Maintain', kcal: tdee, note: '±0 lb/wk', rateLb: 0 }],
      }
    if (goal === 'bulk')
      return {
        tdee,
        options: [
          { id: 'relaxed', label: 'Slow gain', kcal: tdee + 150, note: '+0.25 lb/wk', rateLb: 0.25 },
          { id: 'recommended', label: 'Lean bulk', kcal: tdee + 300, note: '+0.5 lb/wk', rateLb: 0.5 },
        ],
      }
    return {
      tdee,
      options: [
        { id: 'relaxed', label: 'Relaxed', kcal: rate(0.4), note: `−${lb(0.4)} lb/wk`, rateLb: -lb(0.4) },
        { id: 'recommended', label: 'Recommended', kcal: rate(0.65), note: `−${lb(0.65)} lb/wk`, rateLb: -lb(0.65) },
        { id: 'aggressive', label: 'Aggressive', kcal: rate(1.0), note: `−${lb(1.0)} lb/wk`, rateLb: -lb(1.0) },
      ],
    }
  }, [weightLb, heightIn, age, sex, activity, goal])

  function finish() {
    const chosen = calorieOptions.options.find((o) => o.id === plan) ?? calorieOptions.options[0]
    dispatch({
      type: 'completeOnboarding',
      profile: {
        sex,
        age,
        heightIn,
        weightLb,
        activity,
        goalWeight,
        programId,
        calorieTarget: chosen.kcal,
        goal: {
          phase: goal,
          goalWeight: goal === 'maintain' ? weightLb : goalWeight,
          weeklyRateLb: chosen.rateLb ?? 0,
        },
      },
    })
  }

  const canNext = step !== 6 || health === 'connected'

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-page">
      {/* progress */}
      <div className="px-6 pb-2 pt-14">
        {step > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(step - 1)} className="text-[13px] text-ink-3">
              ← Back
            </button>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-series-1 transition-all duration-300"
                style={{ width: `${(step / (TOTAL - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        {step === 0 && (
          <div className="flex h-full flex-col justify-center text-center">
            <svg viewBox="0 0 100 100" className="mx-auto h-20 w-20">
              <rect width="100" height="100" rx="24" fill="#3987e5" />
              <path
                d="M20 54h12l8-22 12 40 10-28 6 10h12"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <h1 className="mt-5 text-[30px] font-bold text-ink">Pulse</h1>
            <p className="mt-2 text-[14px] text-ink-2">
              Training, nutrition, recovery — one system that learns you.
            </p>
            <div className="mt-10 flex flex-col gap-2.5">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl bg-white py-3.5 text-[14px] font-semibold text-black"
              >
                 Continue with Apple
              </button>
              <button
                onClick={() => setStep(1)}
                className="rounded-xl bg-surface-2 py-3.5 text-[14px] font-semibold text-ink"
              >
                G · Continue with Google
              </button>
              <button onClick={() => setStep(1)} className="mt-1 py-2 text-[12px] text-ink-3">
                Explore the demo →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">About you</h2>
            <div className="mt-6 flex gap-2">
              {[
                ['m', 'Male'],
                ['f', 'Female'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSex(id)}
                  className={`flex-1 rounded-xl py-3 text-[14px] font-semibold ${
                    sex === id ? 'bg-series-1 text-white' : 'bg-surface text-ink-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mb-2 mt-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Age</p>
            <Stepper value={age} onChange={setAge} min={14} max={90} />
            <p className="mb-2 mt-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Height</p>
            <Stepper
              value={heightIn}
              onChange={setHeightIn}
              min={48}
              max={90}
              format={(v) => `${Math.floor(v / 12)}'${v % 12}"`}
            />
            <p className="mb-2 mt-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Weight</p>
            <Stepper value={weightLb} onChange={setWeightLb} min={80} max={400} format={(v) => `${v} lb`} />
          </div>
        )}

        {step === 2 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">How active are you?</h2>
            <p className="mt-1 text-[13px] text-ink-3">Outside the gym</p>
            <div className="mt-5 flex flex-col gap-2.5">
              {ACTIVITY.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-left ${
                    activity === a.id ? 'bg-series-1/15 ring-1 ring-series-1' : 'bg-surface'
                  }`}
                >
                  <span className="text-[15px] font-semibold text-ink">{a.label}</span>
                  <span className="text-[12px] text-ink-3">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">What's the goal?</h2>
            <div className="mt-5 flex flex-col gap-2.5">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-left ${
                    goal === g.id ? 'bg-series-1/15 ring-1 ring-series-1' : 'bg-surface'
                  }`}
                >
                  <span className="text-[24px]">{g.emoji}</span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{g.label}</span>
                    <span className="text-[12px] text-ink-3">{g.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {goal !== 'maintain' && (
              <>
                <p className="mb-2 mt-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  Goal weight
                </p>
                <Stepper value={goalWeight} onChange={setGoalWeight} min={80} max={400} format={(v) => `${v} lb`} />
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">Pick a program</h2>
            <p className="mt-1 text-[13px] text-ink-3">Swap any time in Train</p>
            <div className="mt-5 flex flex-col gap-2.5">
              {PROGRAMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProgramId(p.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left ${
                    programId === p.id ? 'bg-series-1/15 ring-1 ring-series-1' : 'bg-surface'
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                    style={{ background: `var(--color-${p.accent})` }}
                  >
                    {p.name[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-ink">{p.name}</span>
                    <span className="text-[11px] text-ink-3">
                      {p.daysPerWeek} days/wk · {p.level}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">Your calorie plan</h2>
            {goal !== 'maintain' && (
              <p className="mt-1 text-[13px] font-medium text-ink-2">
                Goal: {goal === 'cut' ? 'lose to' : 'gain to'} {goalWeight} lb
              </p>
            )}
            <p className="mt-1 text-[13px] text-ink-3">
              Estimated expenditure ~{calorieOptions.tdee.toLocaleString()} kcal/day — it will
              recalibrate from your weigh-ins
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {calorieOptions.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setPlan(o.id)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-left ${
                    plan === o.id ? 'bg-series-1/15 ring-1 ring-series-1' : 'bg-surface'
                  }`}
                >
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{o.label}</span>
                    <span className="text-[12px] text-ink-3">{o.note}</span>
                  </span>
                  <span className="text-[18px] font-bold text-ink">{o.kcal.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="pt-6">
            <h2 className="text-[24px] font-bold text-ink">Connect your wearable</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              Recovery, sleep and strain come from your watch — synced automatically every time
              you open the app
            </p>
            <button
              onClick={() => {
                setHealth('connecting')
                setTimeout(() => setHealth('connected'), 1400)
              }}
              disabled={health !== 'idle'}
              className={`mt-6 flex w-full items-center justify-between rounded-2xl px-5 py-4 ${
                health === 'connected' ? 'bg-good/15 ring-1 ring-good' : 'bg-surface'
              }`}
            >
              <span className="text-[15px] font-semibold text-ink">Google Health Connect (Fitbit)</span>
              {health === 'idle' && <span className="text-[13px] font-semibold text-series-1">Connect</span>}
              {health === 'connecting' && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-3 border-t-transparent" />
              )}
              {health === 'connected' && <span className="text-[13px] font-semibold text-good">Connected ✓</span>}
            </button>
            <div className="mt-2.5 flex w-full items-center justify-between rounded-2xl bg-surface px-5 py-4 opacity-60">
              <span className="text-[15px] font-semibold text-ink">Apple Health</span>
              <span className="text-[12px] text-ink-3">Not now</span>
            </div>
            {health === 'connected' && (
              <p className="mt-4 text-[12px] text-good">16 data types syncing — demo history loaded</p>
            )}
          </div>
        )}
      </div>

      {step > 0 && (
        <div className="px-6 pb-10">
          <button
            onClick={() => (step === TOTAL - 1 ? finish() : setStep(step + 1))}
            disabled={!canNext}
            className={`w-full rounded-xl py-3.5 text-[15px] font-semibold transition-colors ${
              canNext ? 'bg-series-1 text-white' : 'bg-surface-3 text-ink-3'
            }`}
          >
            {step === TOTAL - 1 ? "Let's go" : 'Continue'}
          </button>
        </div>
      )}
    </div>
  )
}
