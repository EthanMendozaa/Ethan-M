// Full-screen active-workout logger: live session timer + XP ticker, focused
// exercise cards with ghost values, drop sets, superset tags, and a docked
// rest timer. Arrow-style feedback, STNDRD-style structure and air.

import { useEffect, useState } from 'react'
import { Chip, useToast } from '../components/ui'
import Sheet from '../components/Sheet'
import PlateCalculator from '../components/PlateCalculator'
import { alternativesFor } from '../lib/programs'
import { REFERENCES, restSecondsFor } from '../lib/engine'

function roundTo(load, inc) {
  const step = inc || 2.5
  return Math.round(load / step) * step
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function Stepper({ value, onChange, step = 1, wide }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(0, Math.round((value - step) * 100) / 100))}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-3 text-[17px] text-ink-2 active:scale-90 transition-transform"
      >
        −
      </button>
      <span className={`${wide ? 'w-14' : 'w-9'} text-center text-[16px] font-bold text-ink`}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.round((value + step) * 100) / 100)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-3 text-[17px] text-ink-2 active:scale-90 transition-transform"
      >
        +
      </button>
    </div>
  )
}


export default function ActiveWorkout({
  logger,
  setLogger,
  planned,
  ready,
  dayRx,
  startedAt,
  onExit,
  onFinish,
}) {
  const toast = useToast()
  const [now, setNow] = useState(Date.now())
  const [rest, setRest] = useState(null) // { until, total }
  const [plateSheet, setPlateSheet] = useState(null)
  const [swapSheet, setSwapSheet] = useState(null) // exercise index
  const [whySheet, setWhySheet] = useState(null) // exercise index

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000))
  const restLeft = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0
  useEffect(() => {
    if (rest && restLeft <= 0) setRest(null)
  }, [rest, restLeft])

  const totalSets = logger.reduce((s, ex) => s + ex.sets.length, 0)
  const doneSets = logger.reduce((s, ex) => s + ex.sets.filter((x) => x.done).length, 0)
  const activeIdx = logger.findIndex((ex) => ex.sets.some((s) => !s.done))

  function updateSet(exIdx, setIdx, field, value) {
    setLogger((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j !== setIdx ? s : { ...s, [field]: value })) },
      ),
    )
  }

  function toggleSet(exIdx, setIdx) {
    const wasDone = logger[exIdx].sets[setIdx].done
    setLogger((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j !== setIdx ? s : { ...s, done: !s.done })) },
      ),
    )
    if (!wasDone) {
      // Full recovery between hard sets: 3 min compounds, 2 min isolation
      const secs = restSecondsFor(logger[exIdx].name)
      setRest({ until: Date.now() + secs * 1000, total: secs })
    }
  }

  function addSet(exIdx, drop = false) {
    setLogger((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1]
        const set = drop
          ? { reps: last.reps, load: roundTo(last.load * 0.8, ex.increment), rir: 0, done: false, drop: true }
          : { reps: last.reps, load: last.load, rir: last.rir, done: false }
        return { ...ex, sets: [...ex.sets, set] }
      }),
    )
    if (drop) toast('Drop set added — strip ~20% and go')
  }

  function swapExercise(exIdx, alt) {
    setLogger((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        return {
          name: alt.name,
          muscles: alt.muscles,
          superset: ex.superset,
          increment: alt.increment || 2.5,
          ghost: null,
          sets: ex.sets
            .filter((s) => !s.drop)
            .map((s) => ({ reps: s.reps, load: alt.defaultLoad ?? 0, rir: 2, done: false, bonus: s.bonus })),
        }
      }),
    )
    setSwapSheet(null)
    toast(`Swapped to ${alt.name}`)
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-page">
      {/* Header */}
      <header className="px-5 pb-3 pt-12">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-1 text-[14px] text-ink-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 9.5 12 15.5 18 9.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Pause
          </button>
          <div className="text-center">
            <p className="text-[16px] font-bold text-ink">{planned.dayName}</p>
            <p className="text-[11px] tabular-nums text-ink-3">
              {fmtClock(elapsed)} · +{doneSets * 10} XP
            </p>
          </div>
          <button
            onClick={onFinish}
            className="rounded-full bg-series-1 px-4 py-1.5 text-[13px] font-semibold text-white active:scale-95 transition-transform"
          >
            Finish
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-series-1 transition-all duration-300"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-ink-3">
            {doneSets}/{totalSets} sets
          </span>
        </div>
      </header>

      {/* Exercise list */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
        {ready.volumeAdjustment === -0.2 && (
          <div className="mb-4 rounded-2xl border border-warning/25 bg-surface px-5 py-3.5 shadow-md shadow-black/20">
            <p className="text-[12px] leading-snug text-ink-2">
              <span className="font-semibold text-warning">Adjusted for recovery:</span> volume
              trimmed −20% today (recovery {ready.recovery}).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {logger.map((ex, exIdx) => {
            const isActive = exIdx === activeIdx
            const exDone = ex.sets.every((s) => s.done)
            return (
              <section
                key={ex.name}
                className={`rounded-2xl bg-surface p-5 shadow-md shadow-black/20 ring-1 transition-opacity ${
                  isActive ? 'ring-series-1/40' : 'ring-white/[0.04]'
                } ${exDone ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[17px] font-bold text-ink">{ex.name}</h3>
                      {exDone && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-good)">
                          <path d="M4.5 12.5 10 18 19.5 6.5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {ex.superset && (
                        <Chip tone="accent" className="!bg-series-2/15 !text-series-2">
                          Superset {ex.superset}
                        </Chip>
                      )}
                      <span className="text-[11px] text-ink-3">{ex.muscles.join(' · ')}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => setSwapSheet(exIdx)}
                      className="rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-ink-2"
                      title="Swap exercise"
                    >
                      ⇄ Swap
                    </button>
                    <button
                      onClick={() => setPlateSheet(Math.max(...ex.sets.map((s) => s.load)))}
                      className="rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-ink-2"
                    >
                      Plates
                    </button>
                  </div>
                </div>

                {ex.ghost && (
                  <p className="mt-2 text-[11px] text-ink-3">
                    Last time: {ex.ghost.map((g) => `${g.reps}×${g.load}`).join('  ·  ')}
                  </p>
                )}

                {/* Engine prescription */}
                {ex.target && ex.target.load > 0 && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-series-1/10 px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold text-series-1">
                      🎯 {ex.target.load} × {ex.target.reps} @RIR {ex.target.rir}
                    </span>
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`text-[11px] font-semibold ${
                          ex.target.change.startsWith('+')
                            ? 'text-good'
                            : ex.target.change.startsWith('−')
                              ? 'text-serious'
                              : 'text-ink-3'
                        }`}
                      >
                        {ex.target.change}
                      </span>
                      <button
                        onClick={() => setWhySheet(exIdx)}
                        className="text-[11px] font-medium text-ink-3 underline decoration-ink-3/40 underline-offset-2"
                      >
                        Why?
                      </button>
                    </span>
                  </div>
                )}

                {/* Column labels */}
                <div className="mt-4 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  <span className="w-7">Set</span>
                  <span className="flex-1 text-center">Lbs</span>
                  <span className="w-[104px] text-center">Reps</span>
                  <span className="w-9 text-center">RIR</span>
                  <span className="w-10" />
                </div>

                <div className="mt-1.5 flex flex-col gap-2">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className={`flex items-center gap-2 rounded-xl px-1.5 py-2 transition-colors ${
                        set.done ? 'bg-good/10' : set.drop ? 'bg-series-2/[0.07]' : 'bg-surface-2'
                      }`}
                    >
                      <span className="flex w-7 justify-center">
                        {set.drop ? (
                          <span className="text-[11px] font-bold text-series-2">↓D</span>
                        ) : set.bonus ? (
                          <span className="text-[13px] text-good">★</span>
                        ) : (
                          <span className="text-[12px] font-semibold text-ink-3">
                            {ex.sets.slice(0, setIdx + 1).filter((s) => !s.drop && !s.bonus).length}
                          </span>
                        )}
                      </span>
                      <div className="flex flex-1 justify-center">
                        <Stepper
                          value={set.load}
                          step={ex.increment}
                          wide
                          onChange={(v) => updateSet(exIdx, setIdx, 'load', v)}
                        />
                      </div>
                      <Stepper
                        value={set.reps}
                        step={1}
                        onChange={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                      />
                      <button
                        onClick={() => updateSet(exIdx, setIdx, 'rir', (set.rir + 1) % 5)}
                        className="w-9 rounded-lg bg-surface-3 py-2 text-center text-[12px] font-semibold text-ink-2"
                      >
                        {set.rir}
                      </button>
                      <button
                        onClick={() => toggleSet(exIdx, setIdx)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90 ${
                          set.done ? 'bg-good text-white' : 'bg-surface-3 text-ink-3'
                        }`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4.5 12.5 10 18 19.5 6.5" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => addSet(exIdx)}
                    className="flex-1 rounded-xl border border-dashed border-surface-3 py-2.5 text-[12px] font-semibold text-ink-2 active:bg-surface-2"
                  >
                    + Set
                  </button>
                  <button
                    onClick={() => addSet(exIdx, true)}
                    className="flex-1 rounded-xl border border-dashed border-series-2/40 py-2.5 text-[12px] font-semibold text-series-2 active:bg-series-2/10"
                  >
                    ↓ Drop set
                  </button>
                </div>
                {ex.sets.some((s) => s.bonus) && (
                  <p className="mt-2 text-[11px] text-good">
                    ★ Bonus set — recovery {ready.recovery}, green light
                  </p>
                )}
              </section>
            )
          })}
        </div>
      </div>

      {/* Docked rest timer */}
      {rest && restLeft > 0 && (
        <div className="border-t border-hairline bg-surface-2 px-5 pb-7 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Rest</p>
              <p className="text-[26px] font-bold tabular-nums leading-tight text-ink">
                {fmtClock(restLeft)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRest((r) => ({ ...r, until: r.until + 30_000, total: r.total + 30 }))}
                className="rounded-xl bg-surface-3 px-4 py-2.5 text-[13px] font-semibold text-ink-2"
              >
                +30s
              </button>
              <button
                onClick={() => setRest(null)}
                className="rounded-xl bg-series-1 px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                Skip
              </button>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-series-1 transition-all duration-1000 ease-linear"
              style={{ width: `${(restLeft / rest.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Sheet open={plateSheet != null} onClose={() => setPlateSheet(null)}>
        {plateSheet != null && <PlateCalculator initialLoad={plateSheet} />}
      </Sheet>

      {/* Why this target — the engine's rationale with sources */}
      <Sheet
        open={whySheet != null}
        onClose={() => setWhySheet(null)}
        title={whySheet != null ? `Why ${logger[whySheet].target?.load} × ${logger[whySheet].target?.reps}?` : ''}
      >
        {whySheet != null && logger[whySheet].target && (
          <div>
            <div className="flex flex-col gap-2">
              {[...logger[whySheet].target.rationale, ...(dayRx?.rationale ?? [])].map((r, i) => (
                <div key={i} className="rounded-xl bg-surface-3 px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-ink">{r.text}</p>
                  {REFERENCES[r.ref] && (
                    <p className="mt-1 text-[10px] leading-snug text-ink-3">{REFERENCES[r.ref]}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-ink-3">
              Deterministic model — same inputs, same answer. Methodology: docs/ALGORITHM.md
            </p>
          </div>
        )}
      </Sheet>

      <Sheet
        open={swapSheet != null}
        onClose={() => setSwapSheet(null)}
        title={swapSheet != null ? `Swap ${logger[swapSheet].name}` : ''}
      >
        {swapSheet != null && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-[12px] text-ink-3">
              Same target muscle ({logger[swapSheet].muscles[0]}), your equipment first:
            </p>
            {alternativesFor(logger[swapSheet].name).map((alt) => (
              <button
                key={alt.name}
                onClick={() => swapExercise(swapSheet, alt)}
                className="flex items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-[14px] font-medium text-ink">{alt.name}</p>
                  <p className="text-[11px] capitalize text-ink-3">{alt.equipment}</p>
                </div>
                <span className="text-[12px] text-ink-3">
                  {alt.defaultLoad ? `${alt.defaultLoad} lb` : 'BW'}
                </span>
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  )
}
