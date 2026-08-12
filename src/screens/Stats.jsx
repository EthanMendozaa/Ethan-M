import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
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
  'Sleep → Training': '😴',
  'Training → Nutrition': '🏋️',
  'Nutrition → Training': '🍗',
  'Nutrition → Recovery': '💚',
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

export default function Stats({ onOpenWeight }) {
  const { days } = useStore()
  const [sheet, setSheet] = useState(null) // 'unified' | { insight }
  const [range, setRange] = useState('8W')
  const [lift, setLift] = useState('Barbell Bench Press')
  const rangeDays = RANGES.find((r) => r.label === range).days

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

  // ---------- Strength ----------
  const e1rmAll = useMemo(() => e1rmSeries(days), [days])

  const liftData = useMemo(() => {
    const startKey = days[Math.max(0, days.length - rangeDays)].key
    return e1rmAll[lift]
      .filter((pt) => pt.key >= startKey)
      .map((pt) => ({ ...pt, label: shortDate(pt.key) }))
  }, [days, e1rmAll, lift, rangeDays])

  const liftStats = useMemo(() => {
    const pts = e1rmAll[lift]
    if (!pts.length) return null
    let best = pts[0]
    for (const pt of pts) if (pt.e1rm >= best.e1rm) best = pt
    const start = pts.slice(0, 3).reduce((s, p) => s + p.e1rm, 0) / Math.min(3, pts.length)
    return { best: best.e1rm, delta: Math.round(best.e1rm - start) }
  }, [e1rmAll, lift])

  const records = useMemo(() => {
    return MAIN_LIFTS.map((l) => {
      const pts = e1rmAll[l]
      if (!pts.length) return null
      let best = pts[0]
      for (const pt of pts) if (pt.e1rm >= best.e1rm) best = pt
      const start = pts.slice(0, 3).reduce((s, p) => s + p.e1rm, 0) / Math.min(3, pts.length)
      return { lift: l, short: LIFT_SHORT[l], best: best.e1rm, date: best.key, delta: Math.round(best.e1rm - start) }
    }).filter(Boolean)
  }, [e1rmAll])

  // ---------- Energy: first block vs last block ----------
  const energy = useMemo(() => {
    const weeks = weeklySetTotals(days)
    const half = Math.floor(weeks.length / 2)
    const mean = (arr) => Math.round(arr.reduce((s, w) => s + w.sets, 0) / arr.length)
    return {
      sets1: mean(weeks.slice(0, half)),
      sets2: mean(weeks.slice(-half)),
      tdee1: tdeeAt(days, Math.min(days.length - 1, half * 7)),
      tdee2: tdeeAt(days, days.length - 1),
    }
  }, [days])

  // ---------- Recovery: HRV by deficit depth (tertiles) ----------
  const hrvBins = useMemo(() => {
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
      rows.push({ deficit: tdee - sum / n, hrv: days[i].hrv })
    }
    if (rows.length < 9) return null
    const sorted = [...rows].sort((a, b) => a.deficit - b.deficit)
    const third = Math.floor(sorted.length / 3)
    const bin = (arr, label) => ({
      label,
      kcal: Math.round(arr.reduce((s, r) => s + r.deficit, 0) / arr.length / 10) * 10,
      hrv: Math.round(arr.reduce((s, r) => s + r.hrv, 0) / arr.length),
    })
    return [
      bin(sorted.slice(0, third), 'Small deficit'),
      bin(sorted.slice(third, third * 2), 'Medium'),
      bin(sorted.slice(-third), 'Deep deficit'),
    ]
  }, [days, rangeDays])

  // ---------- Sleep: last 14 nights ----------
  const sleepData = useMemo(
    () =>
      days.slice(-14).map((d) => ({
        label: keyToDate(d.key).toLocaleDateString('en-US', { weekday: 'narrow' }),
        hours: d.sleep.hours,
        short: d.sleep.hours < 6.5,
      })),
    [days],
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

  const hrvScale = useMemo(() => {
    if (!hrvBins) return null
    const vals = hrvBins.map((b) => b.hrv)
    return { min: Math.min(...vals) - 4, max: Math.max(...vals) + 4 }
  }, [hrvBins])

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

      {/* Momentum */}
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

      <div className="mt-3 flex gap-2.5">
        <StatTile value={lifetime.workouts} label="workouts" />
        <StatTile value={lifetime.volume} unit="lb" label="volume" />
        <StatTile value={lifetime.hours} unit="h" label="lifting" />
        <StatTile value={lifetime.streak} unit="d" label="streak" />
      </div>

      {/* Insights — one line each, tap for the how */}
      <SectionTitle>Insights</SectionTitle>
      <Card className="!p-2">
        {insights.map((ins) => (
          <button
            key={ins.id}
            onClick={() => setSheet({ insight: ins })}
            className="flex w-full items-center gap-3 border-b border-hairline px-2 py-3 text-left last:border-0"
          >
            <span className="text-[17px]">{TAG_META[ins.tag] ?? '💡'}</span>
            <span className="flex-1 text-[13px] font-medium leading-snug text-ink">
              {ins.title}
            </span>
            <span className="text-ink-3">›</span>
          </button>
        ))}
      </Card>

      {/* Strength */}
      <SectionTitle>Strength</SectionTitle>
      <Card className="!p-5">
        <div className="flex gap-1.5">
          {MAIN_LIFTS.map((l) => (
            <button
              key={l}
              onClick={() => setLift(l)}
              className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors ${
                lift === l ? 'text-white' : 'bg-surface-3 text-ink-3'
              }`}
              style={lift === l ? { background: LIFT_COLORS[l] } : undefined}
            >
              {LIFT_SHORT[l]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[30px] font-bold leading-none text-ink">{liftStats?.best}</span>
          <span className="text-[12px] text-ink-3">lb e1RM</span>
          {liftStats?.delta > 0 && (
            <Chip tone="good" className="ml-1">
              +{liftStats.delta} lb this block
            </Chip>
          )}
        </div>
        <div className="mt-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={liftData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.max(1, Math.floor(liftData.length / 3))} />
              <YAxis {...AXIS} width={40} domain={['dataMin - 6', 'dataMax + 6']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} lb`} />} />
              <Line
                type="monotone"
                dataKey="e1rm"
                name={LIFT_SHORT[lift]}
                stroke={LIFT_COLORS[lift]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-2.5 !p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">Records</p>
          <Chip tone="accent">{records.filter((r) => r.delta > 0).length} PRs this block</Chip>
        </div>
        {records.map((r) => (
          <div key={r.lift} className="flex items-center gap-3 border-b border-hairline py-2.5 last:border-0">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LIFT_COLORS[r.lift] }} />
            <span className="w-14 text-[13px] text-ink-2">{r.short}</span>
            <span className="text-[16px] font-bold text-ink">{r.best} lb</span>
            {r.delta > 0 && <span className="text-[11px] font-semibold text-good">+{r.delta}</span>}
            <span className="ml-auto text-[11px] text-ink-3">
              {keyToDate(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </Card>

      {/* Energy: block comparison, not a time series */}
      <SectionTitle>Training ↔ energy</SectionTitle>
      <Card className="!p-5">
        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-x-3 gap-y-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
            First 6 wks
          </span>
          <span />
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
            Last 6 wks
          </span>
          <span />
          <div>
            <p className="text-[22px] font-bold text-ink">{energy.sets1}</p>
            <p className="text-[10px] text-ink-3">sets / week</p>
          </div>
          <span className="text-[16px] text-ink-3">→</span>
          <div>
            <p className="text-[22px] font-bold text-ink">{energy.sets2}</p>
            <p className="text-[10px] text-ink-3">sets / week</p>
          </div>
          <Chip tone="accent">
            +{Math.round(((energy.sets2 - energy.sets1) / energy.sets1) * 100)}%
          </Chip>
          <div>
            <p className="text-[22px] font-bold text-ink">{energy.tdee1?.toLocaleString()}</p>
            <p className="text-[10px] text-ink-3">kcal burned / day</p>
          </div>
          <span className="text-[16px] text-ink-3">→</span>
          <div>
            <p className="text-[22px] font-bold text-ink">{energy.tdee2?.toLocaleString()}</p>
            <p className="text-[10px] text-ink-3">kcal burned / day</p>
          </div>
          <Chip tone="good">+{energy.tdee2 - energy.tdee1}</Chip>
        </div>
        <p className="mt-4 border-t border-hairline pt-3 text-[12px] text-ink-2">
          Train more → burn more → eat more.
        </p>
      </Card>

      {/* Recovery */}
      <SectionTitle>Recovery</SectionTitle>
      {hrvBins && hrvScale && (
        <Card className="!p-5">
          <p className="mb-4 text-[13px] font-semibold text-ink">
            Morning HRV by deficit size
          </p>
          {hrvBins.map((b) => (
            <div key={b.label} className="mb-4 last:mb-0">
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="text-ink-2">
                  {b.label} <span className="text-ink-3">(~{b.kcal} kcal)</span>
                </span>
                <span className="text-[15px] font-bold text-ink">{b.hrv} ms</span>
              </div>
              <div className="relative mt-1.5 h-2 rounded-full bg-surface-3">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-surface bg-series-1"
                  style={{
                    left: `calc(${((b.hrv - hrvScale.min) / (hrvScale.max - hrvScale.min)) * 100}% - 8px)`,
                  }}
                />
              </div>
            </div>
          ))}
          <p className="mt-4 border-t border-hairline pt-3 text-[12px] text-ink-2">
            Cutting harder costs recovery.
          </p>
        </Card>
      )}

      <Card className="mt-2.5 !p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-ink">Sleep · last 14 nights</p>
          <span className={`text-[12px] font-semibold ${shortNights > 2 ? 'text-serious' : 'text-ink-3'}`}>
            {shortNights} under 6.5h
          </span>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={0} />
              <YAxis {...AXIS} width={30} domain={[0, 10]} ticks={[0, 4, 8]} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)} h`} />} />
              <ReferenceLine y={6.5} stroke="var(--color-serious)" strokeWidth={1} />
              <Bar dataKey="hours" name="Sleep" radius={[4, 4, 0, 0]} maxBarSize={16}>
                {sleepData.map((d, i) => (
                  <Cell key={i} fill={d.short ? 'var(--color-serious)' : 'var(--color-series-1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1.5 flex items-center gap-4 text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-serious" /> short night
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-serious" /> 6.5h line
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
            <span className="text-[11px] text-ink-3">body fat · was {body.bfStart?.toFixed(1)}%</span>
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
          40% training consistency ({unified.consistency}) + 30% protein adherence (
          {unified.adherence}) + 30% today's recovery ({unified.recovery}), over the last 28 days.
        </p>
      </Sheet>
      <Sheet
        open={sheet?.insight != null}
        onClose={() => setSheet(null)}
        title={sheet?.insight?.tag}
      >
        {sheet?.insight && (
          <>
            <p className="text-[15px] font-semibold text-ink">{sheet.insight.title}</p>
            <p className="mt-2">{sheet.insight.detail}</p>
          </>
        )}
      </Sheet>
    </div>
  )
}
