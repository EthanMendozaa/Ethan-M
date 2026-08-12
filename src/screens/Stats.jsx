import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { useStore } from '../lib/store'
import { shortDate, keyToDate } from '../lib/dates'
import {
  unifiedScore,
  weeklySetTotals,
  tdeeAt,
  e1rmSeries,
  sessionStats,
  currentStreak,
  trendWeightSeries,
} from '../lib/derived'
import { allInsights } from '../lib/insights'
import { MAIN_LIFTS } from '../lib/programs'
import { Card, Chip, SectionTitle, scoreBand } from '../components/ui'
import ScoreRing from '../components/ScoreRing'
import Sparkline from '../components/Sparkline'
import Sheet from '../components/Sheet'
import { AXIS, GRID, ChartTooltip } from '../components/charts'

const LIFT_COLORS = {
  'Barbell Bench Press': 'var(--color-series-1)',
  'Back Squat': 'var(--color-series-2)',
  'Barbell Row': 'var(--color-series-3)',
  'Overhead Press': 'var(--color-series-4)',
}
const LIFT_SHORT = {
  'Barbell Bench Press': 'Bench',
  'Back Squat': 'Squat',
  'Barbell Row': 'Row',
  'Overhead Press': 'OHP',
}

const RANGES = [
  { label: '4W', days: 28 },
  { label: '8W', days: 56 },
  { label: '3M', days: 90 },
]

const TAG_META = {
  'Sleep → Training': { icon: '😴', color: 'var(--color-series-1)' },
  'Training → Nutrition': { icon: '🏋️', color: 'var(--color-series-2)' },
  'Nutrition → Training': { icon: '🍗', color: 'var(--color-series-5)' },
  'Nutrition → Recovery': { icon: '💚', color: 'var(--color-series-3)' },
}

function StatTile({ value, unit, label }) {
  return (
    <div className="flex-1 rounded-2xl bg-surface px-2 py-4 text-center shadow-md shadow-black/20 ring-1 ring-white/[0.04]">
      <p className="text-[20px] font-bold leading-tight text-ink">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-medium text-ink-3">{unit}</span>}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-3">{label}</p>
    </div>
  )
}

function ChartHeader({ value, label, tone = 'text-ink' }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className={`text-[22px] font-bold leading-tight ${tone}`}>{value}</span>
      <span className="text-[12px] text-ink-3">{label}</span>
    </div>
  )
}

export default function Stats({ onOpenWeight }) {
  const { days } = useStore()
  const [sheet, setSheet] = useState(null)
  const [range, setRange] = useState('8W')
  const rangeDays = RANGES.find((r) => r.label === range).days
  const rangeWeeks = Math.floor(rangeDays / 7)

  // ---------- Overview ----------
  const unified = useMemo(() => unifiedScore(days), [days])
  const prevUnified = useMemo(
    () => (days.length > 56 ? unifiedScore(days.slice(0, days.length - 28)) : null),
    [days],
  )
  const momentumDelta = prevUnified ? unified.score - prevUnified.score : null
  const band = scoreBand('recovery', unified.score)

  const lifetime = useMemo(() => {
    const sessions = days.filter((d) => d.session)
    const volume = sessions.reduce((s, d) => s + sessionStats(d.session).volume, 0)
    const sets = sessions.reduce((s, d) => s + sessionStats(d.session).sets, 0)
    return {
      workouts: sessions.length,
      volume:
        volume >= 1_000_000 ? `${(volume / 1_000_000).toFixed(2)}M` : `${Math.round(volume / 1000)}k`,
      hours: Math.round((sets * 3.2) / 60),
      streak: currentStreak(days),
    }
  }, [days])

  const insights = useMemo(() => allInsights(days), [days])

  // ---------- Range-filtered chart data ----------
  const weeklyData = useMemo(() => {
    const weeks = weeklySetTotals(days).slice(-rangeWeeks)
    const offset = weeklySetTotals(days).length - weeks.length
    return weeks.map((w, i) => {
      const endIdx = Math.min(
        days.length - 1,
        (offset + i + 1) * 7 - 1 + (days.length - weeklySetTotals(days).length * 7),
      )
      return { label: shortDate(w.key), sets: w.sets, tdee: tdeeAt(days, endIdx) }
    })
  }, [days, rangeWeeks])

  const tdeeShift = useMemo(() => {
    const vals = weeklyData.map((w) => w.tdee).filter((v) => v != null)
    if (vals.length < 2) return null
    return Math.round((vals[vals.length - 1] - vals[0]) / 10) * 10
  }, [weeklyData])

  const hrvDeficit = useMemo(() => {
    const rows = []
    for (let i = Math.max(20, days.length - rangeDays); i < days.length; i++) {
      const tdee = tdeeAt(days, i)
      if (tdee == null) continue
      let sum = 0
      let n = 0
      for (let j = i - 6; j <= i; j++) {
        if (days[j].intake?.kcal != null && !days[j].partial) {
          sum += days[j].intake.kcal
          n += 1
        }
      }
      if (n < 5) continue
      rows.push({ deficit: Math.round(tdee - sum / n), hrv: days[i].hrv })
    }
    return rows
  }, [days, rangeDays])

  const hrvGap = useMemo(() => {
    if (hrvDeficit.length < 12) return null
    const sorted = [...hrvDeficit].sort((a, b) => a.deficit - b.deficit)
    const third = Math.floor(sorted.length / 3)
    const mean = (arr) => arr.reduce((s, r) => s + r.hrv, 0) / arr.length
    return Math.round(mean(sorted.slice(0, third)) - mean(sorted.slice(-third)))
  }, [hrvDeficit])

  const e1rmAll = useMemo(() => e1rmSeries(days), [days])

  const e1rmData = useMemo(() => {
    const startKey = days[Math.max(0, days.length - rangeDays)].key
    const byKey = {}
    for (const lift of MAIN_LIFTS) {
      for (const pt of e1rmAll[lift]) {
        if (pt.key < startKey) continue
        ;(byKey[pt.key] ??= { key: pt.key, label: shortDate(pt.key) })[LIFT_SHORT[lift]] = pt.e1rm
      }
    }
    return Object.values(byKey).sort((a, b) => (a.key < b.key ? -1 : 1))
  }, [days, e1rmAll, rangeDays])

  const records = useMemo(() => {
    return MAIN_LIFTS.map((lift) => {
      const pts = e1rmAll[lift]
      if (!pts.length) return null
      let best = pts[0]
      for (const pt of pts) if (pt.e1rm >= best.e1rm) best = pt
      const start = pts.slice(0, 3).reduce((s, p) => s + p.e1rm, 0) / Math.min(3, pts.length)
      return {
        lift,
        short: LIFT_SHORT[lift],
        best: best.e1rm,
        date: best.key,
        delta: Math.round(best.e1rm - start),
      }
    }).filter(Boolean)
  }, [e1rmAll])

  const sleepData = useMemo(
    () =>
      days.slice(-Math.min(rangeDays, 28)).map((d) => ({
        label: shortDate(d.key),
        hours: d.sleep.hours,
        short: d.sleep.hours < 6.5,
      })),
    [days, rangeDays],
  )
  const shortNights = sleepData.filter((d) => d.short).length

  const body = useMemo(() => {
    const trend = trendWeightSeries(days).filter((t) => t.trend != null)
    const bf = days.map((d) => d.bodyFatPct)
    return {
      weight: trend[trend.length - 1]?.trend,
      weightSpark: trend.slice(-30).map((t) => t.trend),
      bfNow: bf[bf.length - 1],
      bfStart: bf[0],
      bfSpark: bf.slice(-30),
    }
  }, [days])

  return (
    <div className="pt-2">
      <header className="mb-3 flex items-center justify-between px-1">
        <h1 className="text-[24px] font-bold text-ink">Stats</h1>
        <div className="flex overflow-hidden rounded-lg bg-surface">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                range === r.label ? 'bg-series-1 text-white' : 'text-ink-3'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* Momentum hero */}
      <Card onClick={() => setSheet('unified')} className="flex items-center gap-5 !p-5">
        <div className="relative flex items-center justify-center">
          <ScoreRing value={unified.score} color={band.color} size={96} stroke={8} />
          <div className="absolute flex flex-col items-center">
            <span className="text-[28px] font-bold text-ink">{unified.score}</span>
            <span className="text-[9px] uppercase tracking-wide text-ink-3">Momentum</span>
          </div>
        </div>
        <div className="flex-1">
          {momentumDelta != null && (
            <Chip tone={momentumDelta >= 0 ? 'good' : 'warning'} className="mb-2">
              {momentumDelta >= 0 ? '↑' : '↓'} {Math.abs(momentumDelta)} vs last month
            </Chip>
          )}
          {[
            ['Consistency', unified.consistency, 'var(--color-series-1)'],
            ['Nutrition', unified.adherence, 'var(--color-protein)'],
            ['Recovery', unified.recovery, 'var(--color-good)'],
          ].map(([label, v, color]) => (
            <div key={label} className="mb-1.5 last:mb-0">
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-3">{label}</span>
                <span className="font-semibold text-ink">{v}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lifetime tiles */}
      <div className="mt-3 flex gap-2.5">
        <StatTile value={lifetime.workouts} label="workouts" />
        <StatTile value={lifetime.volume} unit="lb" label="total volume" />
        <StatTile value={lifetime.hours} unit="h" label="under the bar" />
        <StatTile value={lifetime.streak} unit="d" label="streak" />
      </div>

      {/* Insights */}
      <SectionTitle>What your data is saying</SectionTitle>
      <div className="flex flex-col gap-2">
        {insights.map((ins) => {
          const meta = TAG_META[ins.tag] ?? { icon: '💡', color: 'var(--color-series-1)' }
          return (
            <Card key={ins.id} className="flex gap-3 !p-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px]"
                style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}
              >
                {meta.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                    {ins.tag}
                  </span>
                  <span className="shrink-0 text-[15px] font-bold" style={{ color: meta.color }}>
                    {ins.stat}
                  </span>
                </div>
                <h3 className="mt-0.5 text-[13.5px] font-semibold leading-snug text-ink">
                  {ins.title}
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-ink-2">{ins.detail}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Strength */}
      <SectionTitle>Strength</SectionTitle>
      <Card className="!p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">Records · estimated 1RM</p>
          <Chip tone="accent">{records.filter((r) => r.delta > 0).length} PRs this block</Chip>
        </div>
        {records.map((r) => (
          <div key={r.lift} className="flex items-center gap-3 border-b border-hairline py-2.5 last:border-0">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LIFT_COLORS[r.lift] }} />
            <span className="w-14 text-[13px] text-ink-2">{r.short}</span>
            <span className="text-[16px] font-bold text-ink">{r.best} lb</span>
            {r.delta > 0 && (
              <span className="text-[11px] font-semibold text-good">+{r.delta} lb</span>
            )}
            <span className="ml-auto text-[11px] text-ink-3">
              {keyToDate(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </Card>

      <Card className="mt-2.5 !p-5">
        <ChartHeader
          value="Holding through the cut"
          label={`e1RM · last ${range.toLowerCase()}`}
        />
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={e1rmData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.max(1, Math.floor(e1rmData.length / 3))} />
              <YAxis {...AXIS} width={46} domain={['dataMin - 15', 'dataMax + 15']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} lb`} />} />
              <Legend
                iconType="plainline"
                formatter={(value) => (
                  <span style={{ color: 'var(--color-ink-2)', fontSize: 11 }}>{value}</span>
                )}
              />
              {MAIN_LIFTS.map((lift) => (
                <Line
                  key={lift}
                  type="monotone"
                  dataKey={LIFT_SHORT[lift]}
                  name={LIFT_SHORT[lift]}
                  stroke={LIFT_COLORS[lift]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Energy */}
      <SectionTitle>Training ↔ energy</SectionTitle>
      <Card className="!p-5">
        <ChartHeader
          value={tdeeShift != null ? `${tdeeShift >= 0 ? '+' : ''}${tdeeShift} kcal` : '—'}
          label="expenditure change as volume ramped"
          tone={tdeeShift >= 0 ? 'text-series-1' : 'text-ink'}
        />
        <p className="mb-1 text-[11px] font-medium text-ink-3">Weekly training sets</p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 2, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} hide />
              <YAxis {...AXIS} width={40} domain={[0, 'dataMax + 10']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} sets`} />} />
              <Bar dataKey="sets" name="Sets" fill="var(--color-series-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mb-1 mt-2 text-[11px] font-medium text-ink-3">Estimated TDEE (kcal)</p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 2, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.max(1, Math.floor(weeklyData.length / 3))} />
              <YAxis {...AXIS} width={46} domain={['dataMin - 40', 'dataMax + 40']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v?.toLocaleString()} kcal`} />} />
              <Line type="monotone" dataKey="tdee" name="TDEE" stroke="var(--color-series-1)" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Same weeks, stacked — more training, more energy out, more food budget.
        </p>
      </Card>

      {/* Recovery */}
      <SectionTitle>Recovery</SectionTitle>
      <Card className="!p-5">
        <ChartHeader
          value={hrvGap != null ? `−${hrvGap} ms` : '—'}
          label="HRV on deepest- vs shallowest-deficit days"
        />
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="deficit" name="7-day deficit" type="number" {...AXIS} domain={['dataMin - 40', 'dataMax + 40']} />
              <YAxis dataKey="hrv" name="HRV" type="number" {...AXIS} width={40} domain={['dataMin - 4', 'dataMax + 4']} />
              <ZAxis range={[26, 26]} />
              <Tooltip
                content={<ChartTooltip formatter={(v, key) => (key === 'deficit' ? `${v} kcal` : `${v} ms`)} />}
              />
              <Scatter data={hrvDeficit} fill="var(--color-series-1)" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-ink-3">
          Each dot is a day — x: average 7-day deficit (kcal), y: morning HRV (ms).
        </p>
      </Card>

      <Card className="mt-2.5 !p-5">
        <ChartHeader
          value={`${shortNights} short night${shortNights === 1 ? '' : 's'}`}
          label={`under 6.5h · last ${Math.min(rangeDays, 28)} days`}
          tone={shortNights > 5 ? 'text-serious' : 'text-ink'}
        />
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={6} />
              <YAxis {...AXIS} width={34} domain={[0, 10]} ticks={[0, 4, 8]} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)} h`} />} />
              <ReferenceLine y={6.5} stroke="var(--color-serious)" strokeWidth={1} />
              <Bar dataKey="hours" name="Sleep" radius={[3, 3, 0, 0]} maxBarSize={9}>
                {sleepData.map((d, i) => (
                  <Cell key={i} fill={d.short ? 'var(--color-serious)' : 'var(--color-series-1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex items-center gap-4 text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-series-1" /> ≥ 6.5h
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-serious" /> short night (hits next-day lifts)
          </span>
        </div>
      </Card>

      {/* Body */}
      <SectionTitle>Body</SectionTitle>
      <Card onClick={onOpenWeight} className="flex items-center gap-4 !p-5">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-ink">{body.weight?.toFixed(1)}</span>
            <span className="text-[12px] text-ink-3">lb trend</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-ink-2">{body.bfNow?.toFixed(1)}%</span>
            <span className="text-[11px] text-ink-3">
              body fat · was {body.bfStart?.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Sparkline data={body.weightSpark} width={84} height={26} accent="var(--color-series-1)" />
          <Sparkline data={body.bfSpark} width={84} height={26} accent="var(--color-series-3)" />
        </div>
        <span className="text-ink-3">›</span>
      </Card>

      <Sheet open={sheet === 'unified'} onClose={() => setSheet(null)} title="How Momentum works">
        <p>
          Momentum blends 28-day training consistency ({unified.consistency}, weight 40%),
          protein-target adherence ({unified.adherence}, 30%) and today's recovery (
          {unified.recovery}, 30%) into one number — one input from each subsystem of the app.
        </p>
      </Sheet>
    </div>
  )
}
