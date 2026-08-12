import { useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useStore } from '../lib/store'
import { shortDate } from '../lib/dates'
import {
  trendWeightSeries,
  tdeeSeries,
  tdeeAt,
  weeklyCheckIn,
  macroTargets,
  weightJourney,
} from '../lib/derived'
import { Card, Chip, SectionTitle } from '../components/ui'
import Sheet from '../components/Sheet'
import Sparkline from '../components/Sparkline'
import { AXIS, GRID, ChartTooltip } from '../components/charts'

function MacroBar({ label, eaten, target, colorVar }) {
  const pct = Math.min(100, (eaten / target) * 100)
  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-ink-3">{label}</span>
        <span className="text-[11px] text-ink-2">
          <span className="font-semibold text-ink">{eaten}</span>/{target}g
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `var(${colorVar})` }}
        />
      </div>
    </div>
  )
}

const SLOT_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  logged: 'Quick add',
}

export default function Nutrition({ onOpenWeight, onAddFood }) {
  const { days, today } = useStore()
  const [sheet, setSheet] = useState(null)

  const checkIn = useMemo(() => weeklyCheckIn(days), [days])
  const targets = useMemo(() => macroTargets(checkIn?.newTarget ?? 2050), [checkIn])
  const tdee = useMemo(() => tdeeAt(days, days.length - 1), [days])

  const tdeeData = useMemo(
    () => tdeeSeries(days).map((p) => ({ ...p, label: shortDate(p.key) })),
    [days],
  )
  const journey = useMemo(() => weightJourney(days), [days])
  const weightSpark = useMemo(
    () =>
      trendWeightSeries(days)
        .filter((p) => p.trend != null)
        .slice(-30)
        .map((p) => p.trend),
    [days],
  )

  const remaining = targets.kcal - today.intake.kcal

  return (
    <div className="pt-2">
      <header className="mb-3 flex items-center justify-between px-1">
        <h1 className="text-[24px] font-bold text-ink">Nutrition</h1>
        <Chip tone="accent">Cut · −1.0 lb/wk</Chip>
      </header>

      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] text-ink-3">Remaining today</p>
            <p className="text-[34px] font-bold leading-tight text-ink">
              {remaining.toLocaleString()}
              <span className="ml-1 text-[14px] font-medium text-ink-3">kcal</span>
            </p>
          </div>
          <p className="text-[12px] text-ink-3">
            {today.intake.kcal.toLocaleString()} of {targets.kcal.toLocaleString()}
          </p>
        </div>
        <div className="mt-3 flex gap-4">
          <MacroBar label="Protein" eaten={today.intake.protein} target={targets.protein} colorVar="--color-protein" />
          <MacroBar label="Carbs" eaten={today.intake.carbs} target={targets.carbs} colorVar="--color-carbs" />
          <MacroBar label="Fat" eaten={today.intake.fat} target={targets.fat} colorVar="--color-fat" />
        </div>
      </Card>

      <SectionTitle
        right={
          <button onClick={() => setSheet('tdee')} className="text-[12px] font-medium text-series-1">
            Why?
          </button>
        }
      >
        Expenditure
      </SectionTitle>
      <Card>
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] font-bold text-ink">{tdee?.toLocaleString()}</span>
          <span className="text-[13px] text-ink-3">kcal / day</span>
          {checkIn && tdee > checkIn.oldTarget + 300 && (
            <span className="text-[13px] font-semibold text-series-1">↗</span>
          )}
        </div>
        <div className="mt-2 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tdeeData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} interval={Math.floor(tdeeData.length / 3)} />
              <YAxis {...AXIS} domain={['dataMin - 60', 'dataMax + 60']} width={46} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toLocaleString()} kcal`} />} />
              <Line
                type="monotone"
                dataKey="tdee"
                name="TDEE"
                stroke="var(--color-series-1)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Estimated from your last 14 days of weigh-ins and logged intake.
        </p>
      </Card>

      {checkIn && (
        <>
          <SectionTitle>Weekly check-in</SectionTitle>
          <Card className="border border-series-1/20">
            <div className="flex items-center justify-between">
              <Chip tone="accent">Coaching update</Chip>
              <span className="text-[11px] text-ink-3">applies Monday</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-center">
                <p className="text-[11px] text-ink-3">Old target</p>
                <p className="text-[20px] font-semibold text-ink-2 line-through decoration-ink-3/60">
                  {checkIn.oldTarget.toLocaleString()}
                </p>
              </div>
              <span className="text-ink-3">→</span>
              <div className="text-center">
                <p className="text-[11px] text-ink-3">New target</p>
                <p className="text-[20px] font-bold text-ink">{checkIn.newTarget.toLocaleString()}</p>
              </div>
              <p className="ml-2 flex-1 text-[12px] leading-snug text-ink-2">
                Trending {checkIn.observedRate} lb/wk vs {checkIn.targetRate} target →{' '}
                {checkIn.adjustment >= 0 ? '+' : ''}
                {checkIn.adjustment} kcal
              </p>
            </div>
          </Card>
        </>
      )}

      <SectionTitle>Weight</SectionTitle>
      <Card onClick={onOpenWeight} className="flex items-center gap-4 !py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold text-ink">{journey?.now.toFixed(1)}</span>
            <span className="text-[12px] text-ink-3">lb trend</span>
          </div>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              journey?.weekDelta < -0.05 ? 'bg-good/15 text-good' : 'bg-surface-2 text-ink-2'
            }`}
          >
            {journey?.weekDelta < -0.05 ? '↓' : '→'} {Math.abs(journey?.weekDelta ?? 0).toFixed(1)}{' '}
            lb this wk
          </span>
        </div>
        <Sparkline
          data={weightSpark}
          width={90}
          height={32}
          color="var(--color-ink-3)"
          accent="var(--color-series-1)"
        />
        <span className="text-ink-3">›</span>
      </Card>

      <SectionTitle
        right={
          <button
            onClick={() => onAddFood('search')}
            className="rounded-full bg-series-1 px-3 py-1 text-[12px] font-semibold text-white"
          >
            + Add food
          </button>
        }
      >
        Food log
      </SectionTitle>
      <div className="flex flex-col gap-2">
        {today.meals.map((meal, i) => (
          <Card key={i} className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">{SLOT_LABELS[meal.slot]}</span>
              <span className="text-[11px] text-ink-3">{meal.time}</span>
            </div>
            {meal.items.map((it, j) => (
              <div key={j} className="mt-1.5 flex items-center justify-between text-[13px]">
                <span className="text-ink-2">{it.name}</span>
                <span className="text-ink-3">{it.kcal} kcal</span>
              </div>
            ))}
            <div className="mt-2 border-t border-hairline pt-1.5 text-[11px] text-ink-3">
              {meal.kcal} kcal · P {meal.p} · C {meal.c} · F {meal.f}
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={sheet === 'tdee'} onClose={() => setSheet(null)} title="Why did this change?">
        <p>
          Expenditure = mean logged intake − (daily trend-weight change × 3,500 kcal/lb), over a
          trailing 14-day window. It re-estimates continuously as you weigh in and log food;
          weekly coaching moves your calorie <em>targets</em> in clamped ±100 kcal steps so the
          plan never whipsaws.
        </p>
        <p className="mt-3">
          It has climbed recently because your training volume is up this block — more sets, more
          energy out, more food budget.
        </p>
      </Sheet>
    </div>
  )
}
