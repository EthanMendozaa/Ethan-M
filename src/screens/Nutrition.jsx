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
  macroTargets,
  weightJourney,
} from '../lib/derived'
import { calorieCoach, checkInStatus, REFERENCES } from '../lib/engine'
import { Card, Chip, SectionTitle, useToast } from '../components/ui'
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

export default function Nutrition({ onOpenWeight, onAddFood, onOpenGoal }) {
  const { days, today, todayKey, dispatch, userState } = useStore()
  const toast = useToast()
  const [sheet, setSheet] = useState(null)
  const [editItem, setEditItem] = useState(null) // { uid, name, base, mult, slot }

  const calorieTarget = userState.calorieTarget ?? 2050
  const goal = userState.goal ?? { phase: 'cut', goalWeight: 145, weeklyRateLb: -0.96 }
  const coach = useMemo(
    () => calorieCoach(days, calorieTarget, goal),
    [days, calorieTarget, goal],
  )
  const checkIn = checkInStatus(userState.lastCheckIn, todayKey, coach.status)
  const targets = useMemo(() => macroTargets(calorieTarget), [calorieTarget])
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
        <Chip tone="accent">
          {goal.phase === 'bulk'
            ? `Bulk · +${Math.abs(goal.weeklyRateLb)} lb/wk`
            : goal.phase === 'maintain'
              ? 'Maintain'
              : `Cut · ${goal.weeklyRateLb} lb/wk`}
        </Chip>
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
          {tdee > calorieTarget + 300 && (
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
        <p className="mt-2 text-[11px] text-ink-3">From 14 days of weigh-ins + intake</p>
      </Card>

      <SectionTitle
        right={
          <button onClick={onOpenGoal} className="text-[12px] font-medium text-series-1">
            Strategy →
          </button>
        }
      >
        Calorie coach
      </SectionTitle>
      {checkIn.due ? (
        <Card
          onClick={onOpenGoal}
          className={
            coach.status === 'goal-reached'
              ? 'border border-good/30'
              : 'border border-series-1/20'
          }
        >
          <div className="flex items-center justify-between">
            <Chip tone={coach.status === 'goal-reached' ? 'good' : 'accent'}>
              {coach.status === 'goal-reached' ? '🎉 Goal reached' : 'Weekly check-in ready'}
            </Chip>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSheet('coach')
              }}
              className="text-[12px] font-medium text-series-1"
            >
              Why?
            </button>
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            {coach.observedRate} lb/wk vs {coach.targetRate} target
            {coach.suggested !== calorieTarget &&
              ` → proposing ${coach.suggested.toLocaleString()} kcal`}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenGoal()
            }}
            className="mt-3 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Review program update →
          </button>
        </Card>
      ) : (
        <Card className="flex items-center justify-between py-3">
          <span className="text-[13px] text-ink-2">
            {coach.status === 'collecting'
              ? `Need ${coach.needed} more weigh-ins to calibrate`
              : `On plan — ${calorieTarget.toLocaleString()} kcal · next check-in in ${checkIn.daysToNext}d`}
          </span>
          {coach.status !== 'collecting' && (
            <button onClick={() => setSheet('coach')} className="text-[12px] font-medium text-series-1">
              Why?
            </button>
          )}
        </Card>
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
      {/* Persistent food search bar (opens the add-food flows) */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => onAddFood('search')}
          className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-[13px] text-ink-3"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Search for a food
          <span className="ml-auto" onClick={(e) => { e.stopPropagation(); onAddFood('barcode') }}>
            ║▌║
          </span>
        </button>
        <button
          onClick={() => onAddFood('describe')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-[15px]"
          aria-label="Describe food"
        >
          ✨
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {today.meals.map((meal, i) => (
          <Card key={i} className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">{SLOT_LABELS[meal.slot]}</span>
              <span className="text-[11px] text-ink-3">{meal.time}</span>
            </div>
            {meal.items.map((it) => (
              <button
                key={it.uid}
                onClick={() => setEditItem({ ...it, slot: meal.slot })}
                className="mt-1 flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-[13px] active:bg-surface-2"
              >
                <span className="text-ink-2">
                  {it.name}
                  {it.mult !== 1 && (
                    <span className="ml-1.5 rounded bg-series-1/15 px-1 py-0.5 text-[10px] font-semibold text-series-1">
                      ×{it.mult}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-ink-3">
                  {it.kcal} kcal
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.6">
                    <path d="M15 4l5 5L8 21H3v-5L15 4z" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
            <div className="mt-2 border-t border-hairline pt-1.5 text-[11px] text-ink-3">
              {meal.kcal} kcal · P {meal.p} · C {meal.c} · F {meal.f}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit a logged item: portion, move, duplicate, remove */}
      <Sheet open={editItem != null} onClose={() => setEditItem(null)} title={editItem?.name}>
        {editItem && (
          <div>
            <p className="text-[12px] text-ink-3">
              {Math.round(editItem.base.kcal * editItem.mult)} kcal · P{' '}
              {Math.round(editItem.base.p * editItem.mult)} · C{' '}
              {Math.round(editItem.base.c * editItem.mult)} · F{' '}
              {Math.round(editItem.base.f * editItem.mult)}
            </p>
            <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              Portion
            </p>
            <div className="flex gap-1.5">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    dispatch({ type: 'editFood', key: todayKey, uid: editItem.uid, change: { mult: m } })
                    setEditItem({ ...editItem, mult: m })
                  }}
                  className={`flex-1 rounded-lg py-2 text-[12px] font-semibold ${
                    editItem.mult === m ? 'bg-series-1 text-white' : 'bg-surface-3 text-ink-2'
                  }`}
                >
                  ×{m}
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              Move to
            </p>
            <div className="flex gap-1.5">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((slot) => (
                <button
                  key={slot}
                  onClick={() => {
                    dispatch({ type: 'editFood', key: todayKey, uid: editItem.uid, change: { moveTo: slot } })
                    setEditItem(null)
                    toast(`Moved to ${SLOT_LABELS[slot].toLowerCase()}`)
                  }}
                  className={`flex-1 rounded-lg py-2 text-[12px] font-medium ${
                    editItem.slot === slot ? 'bg-series-1/20 text-series-1' : 'bg-surface-3 text-ink-2'
                  }`}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  dispatch({
                    type: 'addFood',
                    key: todayKey,
                    item: { name: editItem.name, ...editItem.base, fiber: editItem.fiber },
                  })
                  setEditItem(null)
                  toast(`Duplicated ${editItem.name}`)
                }}
                className="flex-1 rounded-xl bg-surface-3 py-3 text-[13px] font-semibold text-ink-2"
              >
                Duplicate
              </button>
              <button
                onClick={() => {
                  dispatch({ type: 'editFood', key: todayKey, uid: editItem.uid, change: { removed: true } })
                  setEditItem(null)
                  toast(`Removed ${editItem.name}`)
                }}
                className="flex-1 rounded-xl bg-critical/15 py-3 text-[13px] font-semibold text-critical"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'coach'} onClose={() => setSheet(null)} title="How this suggestion works">
        {coach.rationale && (
          <div className="flex flex-col gap-2">
            {coach.rationale.map((r, i) => (
              <div key={i} className="rounded-xl bg-surface-3 px-3.5 py-2.5">
                <p className="text-[13px] leading-snug text-ink">{r.text}</p>
                {REFERENCES[r.ref] && (
                  <p className="mt-1 text-[10px] leading-snug text-ink-3">{REFERENCES[r.ref]}</p>
                )}
              </div>
            ))}
            <p className="mt-1 text-[10px] text-ink-3">
              Recomputed after every weigh-in · methodology: docs/ALGORITHM.md
            </p>
          </div>
        )}
      </Sheet>

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
