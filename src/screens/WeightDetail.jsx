// Dedicated weight-tracking experience: hero trend number, goal projection,
// range-filtered chart, and a "drops" feed celebrating every pound lost.
// Arrow-style engagement, STNDRD-style air.

import { useMemo, useState } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '../lib/store'
import { shortDate, longDate } from '../lib/dates'
import {
  trendWeightSeries,
  tdeeAt,
  weightJourney,
  weightMilestones,
  weighInStreak,
} from '../lib/derived'
import { Card, Chip, useToast } from '../components/ui'
import Sheet from '../components/Sheet'
import { AXIS, GRID, ChartTooltip } from '../components/charts'

const RANGES = [
  { label: '2W', days: 14 },
  { label: '6W', days: 42 },
  { label: '3M', days: 90 },
]

function StatTile({ label, value, unit, accent }) {
  return (
    <div className="flex-1 rounded-2xl bg-surface px-3 py-4 text-center shadow-lg shadow-black/25 ring-1 ring-white/5">
      <p className={`text-[20px] font-bold ${accent ? 'text-good' : 'text-ink'}`}>
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-medium text-ink-3">{unit}</span>}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-3">{label}</p>
    </div>
  )
}

export default function WeightDetail({ onClose }) {
  const { days, todayKey, dispatch, userState } = useStore()
  const toast = useToast()
  const [range, setRange] = useState('3M')
  const [sheet, setSheet] = useState(null)
  const [weightInput, setWeightInput] = useState('')

  const goal = userState.goal ?? { phase: 'cut', goalWeight: 145, weeklyRateLb: -0.96 }
  const journey = useMemo(
    () => weightJourney(days, goal.goalWeight, goal.phase),
    [days, goal],
  )
  const milestones = useMemo(
    () => weightMilestones(days, goal.phase === 'bulk' ? 'up' : 'down'),
    [days, goal.phase],
  )
  const phaseLabel =
    goal.phase === 'bulk'
      ? `Bulk · +${Math.abs(goal.weeklyRateLb)} lb/wk`
      : goal.phase === 'maintain'
        ? 'Maintain'
        : `Cut · ${goal.weeklyRateLb} lb/wk`
  const streak = useMemo(() => weighInStreak(days), [days])
  const today = days[days.length - 1]
  const hasWeighedIn = today.weightLb != null

  const chartData = useMemo(() => {
    const n = RANGES.find((r) => r.label === range)?.days ?? 90
    return trendWeightSeries(days)
      .slice(-n)
      .filter((p) => p.scale != null || p.trend != null)
      .map((p) => ({ ...p, label: shortDate(p.key) }))
  }, [days, range])

  const lastTrendPoint = [...chartData].reverse().find((p) => p.trend != null)

  function saveWeighIn() {
    const w = parseFloat(weightInput)
    if (!w || w < 80 || w > 400) return
    const before = tdeeAt(days, days.length - 1)
    dispatch({ type: 'addWeighIn', key: todayKey, weightLb: Math.round(w * 10) / 10 })
    const merged = days.map((d) => (d.key === todayKey ? { ...d, weightLb: w } : d))
    const after = tdeeAt(merged, merged.length - 1)
    const dTdee = after != null && before != null ? after - before : 0
    toast(`Logged ${w.toFixed(1)} lb · TDEE ${dTdee >= 0 ? '+' : ''}${dTdee} kcal`)
    setSheet(null)
    setWeightInput('')
  }

  if (!journey) return null
  // "Favorable" is direction-aware: down on a cut, up on a bulk
  const dropping =
    goal.phase === 'bulk' ? journey.weekDelta > 0.05 : journey.weekDelta < -0.05

  return (
    // z-20: above the tab bar (z-10), below the phone status bar (z-30)
    <div className="absolute inset-0 z-20 flex flex-col bg-page">
      <header className="flex items-center justify-between px-5 pb-2 pt-14">
        <button onClick={onClose} className="flex items-center gap-1 text-[14px] text-ink-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14.5 5 8 12l6.5 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <Chip tone="accent">{phaseLabel}</Chip>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        {/* Hero */}
        <div className="mt-4 mb-8">
          <p className="text-[12px] font-medium uppercase tracking-wider text-ink-3">Trend weight</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-[56px] font-bold leading-none tracking-tight text-ink">
              {journey.now.toFixed(1)}
            </span>
            <span className="mb-1.5 text-[15px] font-medium text-ink-3">lb</span>
            <span
              className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                dropping ? 'bg-good/15 text-good' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {journey.weekDelta < -0.05 ? '↓' : journey.weekDelta > 0.05 ? '↑' : '→'}{' '}
              {Math.abs(journey.weekDelta).toFixed(1)} this wk
            </span>
          </div>
          <p className="mt-2 text-[13px] text-ink-3">
            {hasWeighedIn
              ? `Scale today: ${today.weightLb.toFixed(1)} lb`
              : 'No weigh-in yet today'}
            {' · '}
            <button onClick={() => setSheet('why')} className="font-medium text-series-1">
              Why trend?
            </button>
          </p>
        </div>

        {/* Goal progress */}
        <Card className="mb-6 !p-5 shadow-lg shadow-black/25 ring-1 ring-white/5">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-ink">
              {goal.phase === 'bulk' ? 'Bulk' : goal.phase === 'maintain' ? 'Hold' : 'Cut'} goal ·{' '}
              {journey.goalLb.toFixed(0)} lb
            </p>
            <p className="text-[12px] text-ink-3">{journey.toGo.toFixed(1)} lb to go</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-good"
              style={{ width: `${Math.round(journey.progress * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3">
            <span>started {journey.start.toFixed(1)}</span>
            <span className="font-medium text-ink-2">
              {Math.round(journey.progress * 100)}% there
            </span>
          </div>
          {journey.goalKey && (
            <p className="mt-3 border-t border-hairline pt-3 text-[12px] text-ink-2">
              On pace for {journey.goalLb.toFixed(0)} lb by{' '}
              <span className="font-semibold text-ink">{longDate(journey.goalKey)}</span>
            </p>
          )}
        </Card>

        {/* Chart */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">History</p>
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
        </div>
        <Card className="mb-6 !p-4 shadow-lg shadow-black/25 ring-1 ring-white/5">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3987e5" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3987e5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID} />
                <XAxis
                  dataKey="label"
                  {...AXIS}
                  interval={Math.max(1, Math.floor(chartData.length / 4))}
                />
                <YAxis
                  {...AXIS}
                  width={40}
                  domain={[
                    (dataMin) => Math.min(dataMin - 0.8, journey.goalLb - 0.6),
                    (dataMax) => dataMax + 0.8,
                  ]}
                  tickFormatter={(v) => Math.round(v)}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(1)} lb`} />} />
                <Area
                  dataKey="trend"
                  name="Trend"
                  stroke="none"
                  fill="url(#trendFill)"
                  connectNulls
                  tooltipType="none"
                  legendType="none"
                />
                <Scatter dataKey="scale" name="Scale" fill="var(--color-ink-3)" opacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="trend"
                  name="Trend"
                  stroke="var(--color-series-1)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <ReferenceLine
                  y={journey.goalLb}
                  stroke="var(--color-good)"
                  strokeWidth={1}
                  label={{
                    value: `Goal ${journey.goalLb.toFixed(0)}`,
                    fill: 'var(--color-ink-3)',
                    fontSize: 10,
                    position: 'insideBottomLeft',
                  }}
                />
                {lastTrendPoint && (
                  <ReferenceDot
                    x={lastTrendPoint.label}
                    y={lastTrendPoint.trend}
                    r={5}
                    fill="var(--color-series-1)"
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-3" /> Scale weight
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-series-1" /> Trend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-good" /> Goal
            </span>
          </div>
        </Card>

        {/* Stat tiles */}
        <div className="mb-6 flex gap-3">
          <StatTile
            label="This week"
            value={`${journey.weekDelta > 0 ? '+' : ''}${journey.weekDelta.toFixed(1)}`}
            unit="lb"
            accent={dropping}
          />
          <StatTile label="Rate" value={journey.ratePerWeek.toFixed(1)} unit="lb/wk" />
          <StatTile
            label="Total drop"
            value={journey.totalDelta.toFixed(1)}
            unit="lb"
            accent={journey.totalDelta < 0}
          />
        </div>

        {/* Weigh-in streak */}
        <Card className="mb-6 flex items-center justify-between !px-5 !py-4 shadow-lg shadow-black/25 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <span className="text-[22px]">🔥</span>
            <p className="text-[14px] font-semibold text-ink">{streak}-day weigh-in streak</p>
          </div>
          <Chip tone="accent">+5 XP/day</Chip>
        </Card>

        {/* Drops feed */}
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-ink-3">Drops</p>
        <div className="flex flex-col gap-2.5">
          {milestones
            .slice(0, 5)
            .map((m, i) => (
              <Card
                key={m.lb}
                className={`flex items-center gap-4 !px-5 !py-4 shadow-lg shadow-black/25 ring-1 ${
                  i === 0 ? 'ring-good/25' : 'ring-white/5'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    i === 0 ? 'bg-good/15 text-good' : 'bg-surface-2 text-ink-2'
                  }`}
                >
                  {goal.phase === 'bulk' ? '↑' : '↓'}
                  {m.lb}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">
                    {goal.phase === 'bulk' ? 'Crossed' : 'Dropped under'} {m.lb} lb
                    {i === 0 ? ' — latest!' : ''}
                  </p>
                  <p className="text-[11px] text-ink-3">{longDate(m.key)}</p>
                </div>
                <Chip tone={i === 0 ? 'good' : 'neutral'}>+25 XP</Chip>
              </Card>
            ))}
          {milestones.length > 5 && (
            <p className="pt-1 text-center text-[11px] text-ink-3">
              +{milestones.length - 5} earlier milestones this phase
            </p>
          )}
        </div>
      </div>

      {/* Log weigh-in CTA */}
      {!hasWeighedIn && (
        <div className="border-t border-hairline bg-page/95 px-5 pb-8 pt-3 backdrop-blur">
          <button
            onClick={() => setSheet('log')}
            className="w-full rounded-xl bg-series-1 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Log today's weigh-in
          </button>
        </div>
      )}

      <Sheet open={sheet === 'log'} onClose={() => setSheet(null)} title="Log weigh-in">
        <p className="mb-3 text-[13px] text-ink-3">
          Trend is currently {journey.now.toFixed(1)} lb — the trend and your TDEE update the
          moment you save.
        </p>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            autoFocus
            placeholder={journey.now.toFixed(1)}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-28 rounded-xl bg-surface-3 px-3 py-3 text-[17px] font-semibold text-ink outline-none placeholder:text-ink-3"
          />
          <button
            onClick={saveWeighIn}
            className="flex-1 rounded-xl bg-series-1 py-3 text-[15px] font-semibold text-white"
          >
            Save
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'why'} onClose={() => setSheet(null)} title="Why trend weight?">
        <p>
          Scale weight swings a pound or two day-to-day from water, sodium and glycogen. Trend
          weight is an exponentially-weighted average (α = 0.25) of your weigh-ins, so it moves
          only when real change accumulates — it's what your goal progress, drops and TDEE are
          computed from.
        </p>
      </Sheet>
    </div>
  )
}
