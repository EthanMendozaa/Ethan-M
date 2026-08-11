import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import {
  readiness,
  muscleRecoveryState,
  recoveryEta,
  upcomingSchedule,
  weeklyVolume,
  sessionStats,
  totalXP,
  currentStreak,
  levelFromXP,
  e1rm,
  e1rmSeries,
} from '../lib/derived'
import { PROGRAMS, EXERCISES, MUSCLE_GROUPS } from '../lib/programs'
import { weekday, shortDate } from '../lib/dates'
import { Card, Chip, SectionTitle, useToast } from '../components/ui'
import Sheet from '../components/Sheet'
import BodyMap from '../components/BodyMap'
import ActiveWorkout from './ActiveWorkout'

const STATUS_META = {
  fresh: { label: 'Fresh', color: 'var(--color-good)', tone: 'good' },
  recovering: { label: 'Recovering', color: 'var(--color-warning)', tone: 'warning' },
  fatigued: { label: 'Fatigued', color: 'var(--color-serious)', tone: 'serious' },
}

// Blue intensity steps for the "worked this week" map (dark-surface ordinal ramp)
function volumeColor(sets, mev, mrv) {
  if (sets <= 0) return 'var(--color-surface-3)'
  if (sets < mev / 2) return '#184f95'
  if (sets < mev) return '#256abf'
  if (sets <= mrv) return '#3987e5'
  return '#86b6ef'
}

function VolumeRow({ v }) {
  const max = v.mrv * 1.25
  const inBand = v.sets >= v.mev && v.sets <= v.mrv
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-[12px] text-ink-2">{v.muscle}</span>
      <div className="relative h-3 flex-1 rounded-full bg-surface-3">
        <div
          className="absolute inset-y-0 rounded-sm bg-white/10"
          style={{ left: `${(v.mev / max) * 100}%`, width: `${((v.mrv - v.mev) / max) * 100}%` }}
        />
        <div
          className="absolute inset-y-[3px] left-0 rounded-full"
          style={{
            width: `${Math.min(100, (v.sets / max) * 100)}%`,
            background: inBand ? 'var(--color-series-1)' : 'var(--color-warning)',
          }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-[12px] font-semibold text-ink">{v.sets}</span>
    </div>
  )
}

function buildLoggerState(plannedSession, ready) {
  const cut = ready.volumeAdjustment === -0.2
  return plannedSession.exercises.map((ex, idx) => {
    const sets = []
    let n = ex.targetSets
    if (cut) n = Math.max(1, Math.round(n * 0.8))
    if (ready.bonusSet && idx === 0) n += 1
    for (let s = 0; s < n; s++) {
      const ghost = ex.prevSets?.[Math.min(s, (ex.prevSets?.length ?? 1) - 1)]
      sets.push({
        reps: ghost?.reps ?? ex.targetReps,
        load: ghost?.load ?? 0,
        rir: ghost?.rir ?? 2,
        done: false,
        bonus: ready.bonusSet && idx === 0 && s === n - 1,
      })
    }
    return {
      name: ex.name,
      muscles: ex.muscles,
      superset: ex.superset,
      increment: ex.increment || 2.5,
      sets,
      ghost: ex.prevSets,
    }
  })
}

export default function Train() {
  const { days, today, plannedSession, dispatch, todayKey, userState } = useStore()
  const toast = useToast()
  const [view, setView] = useState('home') // home | active | summary
  const [logger, setLogger] = useState(null)
  const [startedAt, setStartedAt] = useState(null)
  const [summary, setSummary] = useState(null)
  const [programSheet, setProgramSheet] = useState(null)
  const [mapMode, setMapMode] = useState('recovery') // recovery | volume
  const [selectedMuscle, setSelectedMuscle] = useState('Chest')
  const [showLibrary, setShowLibrary] = useState(false)

  const ready = useMemo(
    () => readiness(days, today.session ? null : plannedSession?.dayName),
    [days, today, plannedSession],
  )
  const recovery = useMemo(() => muscleRecoveryState(days, todayKey), [days, todayKey])
  const volume = useMemo(() => weeklyVolume(days), [days])
  const schedule = useMemo(() => upcomingSchedule(days, todayKey), [days, todayKey])
  const xp = useMemo(() => totalXP(days, userState.bonusXP), [days, userState])
  const streak = useMemo(() => currentStreak(days), [days])
  const { level, progress } = levelFromXP(xp)
  const weekDone = useMemo(() => days.slice(-7).filter((d) => d.session).length, [days])

  function startSession() {
    if (!logger) {
      setLogger(buildLoggerState(plannedSession, ready))
      setStartedAt(Date.now())
    }
    setView('active')
  }

  function finishSession() {
    const session = {
      dayName: plannedSession.dayName,
      completed: true,
      exercises: logger
        .map((ex) => ({
          name: ex.name,
          muscles: ex.muscles,
          sets: ex.sets
            .filter((s) => s.done && s.load > 0)
            .map(({ reps, load, rir }) => ({ reps, load, rir })),
        }))
        .filter((ex) => ex.sets.length),
    }
    if (!session.exercises.length) {
      toast('Check off at least one set first')
      return
    }
    const history = e1rmSeries(days)
    const prs = []
    for (const ex of session.exercises) {
      const best = Math.max(...ex.sets.map((s) => e1rm(s.load, s.reps, s.rir)))
      const past = history[ex.name]
      if (past?.length && best > Math.max(...past.map((p) => p.e1rm))) {
        prs.push({ name: ex.name, e1rm: Math.round(best) })
      }
    }
    const stats = sessionStats(session)
    const prXP = prs.length * 50
    const minutes = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null
    dispatch({ type: 'completeWorkout', key: todayKey, session, bonusXP: prXP })
    setSummary({ ...stats, prs, prXP, minutes, dayName: session.dayName })
    setLogger(null)
    setStartedAt(null)
    setView('summary')
  }

  // ---------- Summary view ----------
  if (view === 'summary' && summary) {
    return (
      <div className="flex min-h-full flex-col justify-center pt-2">
        <div className="text-center">
          <Chip tone="good">Session complete</Chip>
          <h1 className="mt-3 text-[26px] font-bold text-ink">{summary.dayName}</h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {summary.minutes ? `${summary.minutes} min · ` : ''}muscle recovery & weekly volume
            updated
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Card className="py-5 text-center">
            <p className="text-[22px] font-bold text-ink">{(summary.volume / 1000).toFixed(1)}k</p>
            <p className="text-[11px] text-ink-3">lb volume</p>
          </Card>
          <Card className="py-5 text-center">
            <p className="text-[22px] font-bold text-ink">{summary.sets}</p>
            <p className="text-[11px] text-ink-3">sets</p>
          </Card>
          <Card className="py-5 text-center">
            <p className="text-[22px] font-bold text-series-1">+{summary.xp + summary.prXP}</p>
            <p className="text-[11px] text-ink-3">XP</p>
          </Card>
        </div>
        {summary.prs.length > 0 && (
          <Card className="mt-3 border border-good/25">
            <Chip tone="good">PR!</Chip>
            {summary.prs.map((pr) => (
              <p key={pr.name} className="mt-2 text-[14px] text-ink">
                <span className="font-semibold">{pr.name}</span> — new best e1RM{' '}
                <span className="font-bold text-good">{pr.e1rm} lb</span> (+50 XP)
              </p>
            ))}
          </Card>
        )}
        <Card className="mt-3 flex items-center justify-between">
          <span className="text-[13px] text-ink-2">🔥 Streak</span>
          <span className="text-[15px] font-bold text-ink">{streak} training days</span>
        </Card>
        <button
          onClick={() => setView('home')}
          className="mt-6 rounded-xl bg-series-1 py-3.5 text-[15px] font-semibold text-white"
        >
          Done
        </button>
      </div>
    )
  }

  // ---------- Home view (+ active overlay) ----------
  const activeProgram = PROGRAMS[0]
  return (
    <div className="pt-2">
      <header className="mb-3 flex items-center justify-between px-1">
        <h1 className="text-[24px] font-bold text-ink">Train</h1>
        <div className="flex items-center gap-2">
          <Chip tone="accent">Lv {level}</Chip>
          <Chip>🔥 {streak}</Chip>
        </div>
      </header>

      <Card className="py-3">
        <div className="flex items-center justify-between text-[11px] text-ink-3">
          <span>
            Level {level} · {xp.toLocaleString()} XP
          </span>
          <span>Level {level + 1}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-series-1"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </Card>

      <SectionTitle
        right={
          <span className="text-[11px] text-ink-3">Week 7 of {activeProgram.weeks}</span>
        }
      >
        {activeProgram.name}
      </SectionTitle>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] text-ink-3">{weekDone} of 6 sessions this week</span>
          <div className="flex gap-1">
            {days.slice(-7).map((d) => (
              <span
                key={d.key}
                className={`h-1.5 w-4 rounded-full ${
                  d.session ? 'bg-series-1' : d.plannedSplit ? 'bg-surface-3' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
        {today.session ? (
          <div>
            <Chip tone="good">Done today</Chip>
            <p className="mt-2 text-[15px] font-semibold text-ink">{today.session.dayName}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">
              {sessionStats(today.session).sets} sets ·{' '}
              {(sessionStats(today.session).volume / 1000).toFixed(1)}k lb
            </p>
          </div>
        ) : plannedSession ? (
          <div>
            <p className="text-[16px] font-semibold text-ink">Today: {plannedSession.dayName}</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">{ready.detail}</p>
            <button
              onClick={startSession}
              className="mt-3 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white active:scale-[0.98] transition-transform"
            >
              {logger ? 'Resume session' : 'Start session'}
            </button>
          </div>
        ) : (
          <div>
            <Chip>Rest day</Chip>
            <p className="mt-2 text-[13px] text-ink-2">
              Recovery day — next session is tomorrow. Muscles below are rebuilding.
            </p>
          </div>
        )}
      </Card>

      <SectionTitle
        right={
          <div className="flex overflow-hidden rounded-lg bg-surface">
            {[
              ['recovery', 'Recovery'],
              ['volume', 'This week'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-2.5 py-1 text-[11px] font-medium ${
                  mapMode === mode ? 'bg-series-1 text-white' : 'text-ink-3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        Muscle map
      </SectionTitle>
      <Card className="!p-5">
        <BodyMap
          selected={selectedMuscle}
          onSelect={setSelectedMuscle}
          colorFor={(muscle) => {
            if (mapMode === 'volume') {
              const v = volume.find((x) => x.muscle === muscle)
              return volumeColor(v.sets, v.mev, v.mrv)
            }
            const r = recovery.find((x) => x.muscle === muscle)
            return STATUS_META[r.status].color
          }}
        />
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-3 text-[11px] text-ink-3">
          {mapMode === 'recovery' ? (
            Object.entries(STATUS_META).map(([k, meta]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            ))
          ) : (
            <>
              {[
                ['var(--color-surface-3)', 'none'],
                ['#184f95', 'light'],
                ['#256abf', 'moderate'],
                ['#3987e5', 'in band'],
                ['#86b6ef', 'high'],
              ].map(([c, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                  {label}
                </span>
              ))}
            </>
          )}
        </div>
        {/* Selected muscle detail */}
        {selectedMuscle &&
          (() => {
            const r = recovery.find((x) => x.muscle === selectedMuscle)
            const v = volume.find((x) => x.muscle === selectedMuscle)
            const meta = STATUS_META[r.status]
            return (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <div>
                  <p className="text-[14px] font-semibold text-ink">{selectedMuscle}</p>
                  <p className="text-[11px] text-ink-3">
                    {v.sets} sets this week · band {v.mev}–{v.mrv}
                  </p>
                </div>
                <div className="text-right">
                  <Chip tone={meta.tone}>{meta.label}</Chip>
                  <p className="mt-1 text-[11px] text-ink-3">
                    {r.status === 'fresh' ? 'Ready to train' : `Fresh ${recoveryEta(r.hoursToFresh)}`}
                  </p>
                </div>
              </div>
            )
          })()}
      </Card>

      <SectionTitle>Week ahead</SectionTitle>
      <Card className="!py-2">
        {schedule.map((d, i) => (
          <div
            key={d.key}
            className={`flex items-center justify-between border-b border-hairline py-2.5 last:border-0 ${
              i === 0 ? '' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-9 text-[11px] font-semibold uppercase ${
                  i === 0 ? 'text-series-1' : 'text-ink-3'
                }`}
              >
                {i === 0 ? 'Today' : weekday(d.key)}
              </span>
              <span className={`text-[13px] ${d.name === 'Rest' ? 'text-ink-3' : 'font-medium text-ink'}`}>
                {d.name}
              </span>
            </div>
            {d.name !== 'Rest' &&
              (d.ready ? (
                <span className="text-[11px] font-medium text-good">Muscles ready ✓</span>
              ) : (
                <span className="text-[11px] font-medium text-warning">
                  {d.blockers[0]} still recovering
                </span>
              ))}
          </div>
        ))}
        <p className="border-t border-hairline py-2.5 text-[11px] leading-snug text-ink-3">
          Readiness is projected from each muscle's recovery curve at session time.
        </p>
      </Card>

      <SectionTitle right={<span className="text-[11px] text-ink-3">band = MEV–MRV target</span>}>
        Weekly muscle growth
      </SectionTitle>
      <Card>
        {volume.map((v) => (
          <VolumeRow key={v.muscle} v={v} />
        ))}
        <p className="mt-2 border-t border-hairline pt-2 text-[11px] leading-snug text-ink-3">
          Working sets per muscle group, last 7 days. The lighter band is your effective range —
          below it under-stimulates, above it outpaces recovery.
        </p>
      </Card>

      <SectionTitle>Program library</SectionTitle>
      <div className="flex flex-col gap-2">
        {PROGRAMS.map((p) => (
          <Card key={p.id} onClick={() => setProgramSheet(p)} className="flex items-center gap-3 py-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
              style={{ background: `var(--color-${p.accent})` }}
            >
              {p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold text-ink">{p.name}</span>
                {p.id === 'arnold-split' && <Chip tone="accent">Active</Chip>}
              </div>
              <p className="truncate text-[11px] text-ink-3">
                {p.weeks} wks · {p.daysPerWeek} days/wk · {p.level} · {p.goal}
              </p>
            </div>
            <span className="text-ink-3">›</span>
          </Card>
        ))}
      </div>

      <SectionTitle>Exercises</SectionTitle>
      <Card onClick={() => setShowLibrary(true)} className="flex items-center justify-between py-3">
        <div>
          <p className="text-[14px] font-semibold text-ink">Exercise library</p>
          <p className="text-[11px] text-ink-3">
            {Object.keys(EXERCISES).length} movements · swap any exercise mid-workout
          </p>
        </div>
        <span className="text-ink-3">›</span>
      </Card>

      <Sheet
        open={programSheet != null}
        onClose={() => setProgramSheet(null)}
        title={programSheet?.name}
      >
        {programSheet && (
          <>
            <p>{programSheet.tagline}.</p>
            <div className="mt-3 flex gap-2">
              <Chip>{programSheet.weeks} weeks</Chip>
              <Chip>{programSheet.daysPerWeek} days/week</Chip>
              <Chip>{programSheet.level}</Chip>
            </div>
            {programSheet.sampleDay && (
              <div className="mt-4 rounded-xl bg-surface-3 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  Sample day · {programSheet.sampleDay.title}
                </p>
                {programSheet.sampleDay.exercises.map((name) => (
                  <div key={name} className="flex items-center justify-between py-1">
                    <span className="text-[13px] text-ink">{name}</span>
                    <span className="text-[11px] capitalize text-ink-3">
                      {EXERCISES[name]?.equipment}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {programSheet.id !== 'arnold-split' && (
              <button
                onClick={() => {
                  setProgramSheet(null)
                  toast('Demo history follows the Arnold Split')
                }}
                className="mt-4 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white"
              >
                Preview program
              </button>
            )}
          </>
        )}
      </Sheet>

      <Sheet open={showLibrary} onClose={() => setShowLibrary(false)} title="Exercise library">
        <p className="mb-3 text-[12px] text-ink-3">
          {Object.keys(EXERCISES).length} movements across {MUSCLE_GROUPS.length} muscle groups.
          During a workout, ⇄ Swap offers same-muscle alternatives.
        </p>
        {MUSCLE_GROUPS.map((group) => {
          const list = Object.entries(EXERCISES).filter(([, m]) => m.muscles[0] === group)
          return (
            <div key={group} className="mb-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {group} · {list.length}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {list.map(([name, meta]) => (
                  <span
                    key={name}
                    className="rounded-full bg-surface-3 px-2.5 py-1 text-[11px] text-ink-2"
                  >
                    {name}
                    {meta.main && <span className="ml-1 text-series-1">★</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </Sheet>

      {view === 'active' && logger && (
        <ActiveWorkout
          logger={logger}
          setLogger={setLogger}
          planned={plannedSession}
          ready={ready}
          startedAt={startedAt}
          onExit={() => setView('home')}
          onFinish={finishSession}
        />
      )}
    </div>
  )
}
