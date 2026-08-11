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
import { shortDate } from '../lib/dates'
import { unifiedScore, tdeeSeries, weeklySetTotals, tdeeAt, e1rmSeries } from '../lib/derived'
import { allInsights } from '../lib/insights'
import { MAIN_LIFTS } from '../lib/programs'
import { Card, Chip, SectionTitle, scoreBand } from '../components/ui'
import ScoreRing from '../components/ScoreRing'
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

export default function Stats() {
  const { days } = useStore()
  const [sheet, setSheet] = useState(null)

  const unified = useMemo(() => unifiedScore(days), [days])
  const insights = useMemo(() => allInsights(days), [days])
  const band = scoreBand('recovery', unified.score)

  // TDEE vs weekly volume — two aligned small multiples (never a dual axis).
  const weeklyData = useMemo(() => {
    const weeks = weeklySetTotals(days)
    return weeks.map((w, i) => {
      const endIdx = Math.min(days.length - 1, (i + 1) * 7 - 1 + (days.length - weeks.length * 7))
      return {
        label: shortDate(w.key),
        sets: w.sets,
        tdee: tdeeAt(days, endIdx),
      }
    })
  }, [days])

  const hrvDeficit = useMemo(() => {
    const rows = []
    for (let i = 20; i < days.length; i++) {
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
  }, [days])

  const e1rmData = useMemo(() => {
    const series = e1rmSeries(days)
    const byKey = {}
    for (const lift of MAIN_LIFTS) {
      for (const pt of series[lift]) {
        ;(byKey[pt.key] ??= { key: pt.key, label: shortDate(pt.key) })[LIFT_SHORT[lift]] = pt.e1rm
      }
    }
    return Object.values(byKey).sort((a, b) => (a.key < b.key ? -1 : 1))
  }, [days])

  const sleepData = useMemo(
    () =>
      days.slice(-21).map((d) => ({
        label: shortDate(d.key),
        hours: d.sleep.hours,
        short: d.sleep.hours < 6.5,
      })),
    [days],
  )

  return (
    <div className="pt-2">
      <header className="mb-3 px-1">
        <h1 className="text-[24px] font-bold text-ink">Stats</h1>
      </header>

      <Card onClick={() => setSheet('unified')} className="flex items-center gap-5">
        <div className="relative flex items-center justify-center">
          <ScoreRing value={unified.score} color={band.color} size={96} stroke={8} />
          <div className="absolute flex flex-col items-center">
            <span className="text-[28px] font-bold text-ink">{unified.score}</span>
            <span className="text-[9px] uppercase tracking-wide text-ink-3">Momentum</span>
          </div>
        </div>
        <div className="flex-1">
          {[
            ['Consistency', unified.consistency],
            ['Nutrition', unified.adherence],
            ['Recovery', unified.recovery],
          ].map(([label, v]) => (
            <div key={label} className="mb-1.5 last:mb-0">
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-3">{label}</span>
                <span className="font-semibold text-ink">{v}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-series-1"
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>What your data is saying</SectionTitle>
      <div className="flex flex-col gap-2">
        {insights.map((ins) => (
          <Card key={ins.id} className="border border-white/5">
            <div className="flex items-center justify-between">
              <Chip tone="accent">{ins.tag}</Chip>
              <span className="text-[15px] font-bold text-series-1">{ins.stat}</span>
            </div>
            <h3 className="mt-2 text-[14px] font-semibold leading-snug text-ink">{ins.title}</h3>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">{ins.detail}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Expenditure follows training</SectionTitle>
      <Card>
        <p className="mb-1 text-[11px] font-medium text-ink-3">Weekly training sets</p>
        <div className="h-24">
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
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 2, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.floor(weeklyData.length / 3)} />
              <YAxis {...AXIS} width={46} domain={['dataMin - 40', 'dataMax + 40']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v?.toLocaleString()} kcal`} />} />
              <Line
                type="monotone"
                dataKey="tdee"
                name="TDEE"
                stroke="var(--color-series-1)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Same weeks, stacked: as weekly sets ramped, estimated expenditure followed.
        </p>
      </Card>

      <SectionTitle>HRV vs deficit depth</SectionTitle>
      <Card>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="deficit"
                name="7-day deficit"
                type="number"
                unit=""
                {...AXIS}
                domain={['dataMin - 40', 'dataMax + 40']}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis dataKey="hrv" name="HRV" type="number" {...AXIS} width={46} domain={['dataMin - 4', 'dataMax + 4']} />
              <ZAxis range={[28, 28]} />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(v, key) => (key === 'deficit' ? `${v} kcal` : `${v} ms`)}
                  />
                }
              />
              <Scatter data={hrvDeficit} fill="var(--color-series-1)" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-ink-3">
          Each dot is a day: x = average 7-day energy deficit (kcal), y = that morning’s HRV (ms).
          Deeper deficits sit lower.
        </p>
      </Card>

      <SectionTitle>Main lift e1RM</SectionTitle>
      <Card>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={e1rmData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.floor(e1rmData.length / 3)} />
              <YAxis {...AXIS} width={46} domain={['dataMin - 15', 'dataMax + 15']} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} lb`} />} />
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: 11, color: 'var(--color-ink-3)' }}
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
        <p className="mt-1 text-[11px] leading-snug text-ink-3">
          Estimated 1RM from best set × (1 + (reps + RIR)/30). Holding — even climbing — through
          the cut.
        </p>
      </Card>

      <SectionTitle>Sleep consistency</SectionTitle>
      <Card>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={6} />
              <YAxis {...AXIS} width={36} domain={[0, 10]} ticks={[0, 4, 8]} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)} h`} />} />
              <ReferenceLine
                y={6.5}
                stroke="var(--color-serious)"
                strokeWidth={1}
                strokeDasharray="0"
                label={{ value: '6.5h', fill: 'var(--color-ink-3)', fontSize: 10, position: 'insideTopRight' }}
              />
              <Bar dataKey="hours" name="Sleep" radius={[4, 4, 0, 0]} maxBarSize={10}>
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

      <Sheet open={sheet === 'unified'} onClose={() => setSheet(null)} title="How Momentum works">
        <p>
          Momentum blends 28-day training consistency ({unified.consistency}, weight 40%),
          protein-target adherence ({unified.adherence}, 30%) and today’s recovery (
          {unified.recovery}, 30%) into one number. It’s the “is the whole system working”
          score — each input comes from a different subsystem of the app.
        </p>
      </Sheet>
    </div>
  )
}
