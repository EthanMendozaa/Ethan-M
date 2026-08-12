// The add-food experience behind the "+" launcher: searchable food database
// with serving sizes, barcode/photo capture mocks, the "describe it" AI
// estimator, meal templates (incl. generate-from-remaining-macros), and a
// quick activity logger. One sheet, multiple views.

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { weeklyCheckIn, macroTargets } from '../lib/derived'
import {
  FOOD_DB,
  CATEGORIES,
  RECENT_FOODS,
  MEAL_TEMPLATES,
  foodByName,
  templateTotals,
  estimateFromDescription,
  generateMealForMacros,
} from '../lib/foods'
import { Chip, useToast } from './ui'
import Sheet from './Sheet'

const MULTIPLIERS = [0.5, 1, 1.5, 2]

function scaled(food, mult) {
  return {
    name: mult === 1 ? food.name : `${food.name} ×${mult}`,
    kcal: Math.round(food.kcal * mult),
    p: Math.round(food.p * mult),
    c: Math.round(food.c * mult),
    f: Math.round(food.f * mult),
  }
}

function MacroLine({ kcal, p, c, f }) {
  return (
    <span className="text-[11px] text-ink-3">
      {kcal} kcal · P {p} · C {c} · F {f}
    </span>
  )
}

// ---------- Search view ----------

function SearchView({ addItems }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Recent')
  const [selected, setSelected] = useState(null)
  const [mult, setMult] = useState(1)

  const list = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase()
      return FOOD_DB.filter((food) => food.name.toLowerCase().includes(q))
    }
    if (cat === 'Recent') return RECENT_FOODS.map(foodByName)
    if (cat === 'All') return FOOD_DB
    return FOOD_DB.filter((food) => food.cat === cat)
  }, [query, cat])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search foods…"
        className="w-full rounded-xl bg-surface-3 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-3"
      />
      {!query.trim() && (
        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1">
          {['Recent', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                cat === c ? 'bg-series-1 text-white' : 'bg-surface-3 text-ink-2'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex max-h-72 flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {list.map((food) => (
          <div key={food.name} className="rounded-xl bg-surface-3">
            <button
              onClick={() => {
                setSelected(selected === food.name ? null : food.name)
                setMult(1)
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="text-[20px]">{food.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">{food.name}</span>
                <span className="text-[11px] text-ink-3">
                  {food.serving} · P {food.p}g
                </span>
              </span>
              <span className="text-[13px] font-semibold text-ink-2">{food.kcal}</span>
            </button>
            {selected === food.name && (
              <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2.5">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMult(m)}
                    className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${
                      mult === m ? 'bg-series-1 text-white' : 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    ×{m}
                  </button>
                ))}
                <button
                  onClick={() => addItems([scaled(food, mult)])}
                  className="ml-auto rounded-lg bg-good px-4 py-1.5 text-[13px] font-semibold text-white"
                >
                  Add · {Math.round(food.kcal * mult)}
                </button>
              </div>
            )}
          </div>
        ))}
        {!list.length && (
          <p className="py-6 text-center text-[13px] text-ink-3">No matches — try "Describe it"</p>
        )}
      </div>
    </div>
  )
}

// ---------- Describe (mock AI) ----------

function DescribeView({ addItems }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. grilled chicken burrito with rice, beans and guac"
        className="w-full resize-none rounded-xl bg-surface-3 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink-3"
      />
      <button
        onClick={() => text.trim() && setResult(estimateFromDescription(text))}
        className="mt-2 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white"
      >
        ✨ Estimate macros
      </button>
      {result && (
        <div className="mt-3 rounded-xl bg-surface-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-ink">{result.name}</p>
            <Chip tone="accent">AI estimate</Chip>
          </div>
          <p className="mt-1">
            <MacroLine kcal={result.kcal} p={result.p} c={result.c} f={result.f} />
          </p>
          {result.components.length > 0 && (
            <p className="mt-1 text-[11px] text-ink-3">
              recognized: {result.components.join(', ')}
            </p>
          )}
          <button
            onClick={() =>
              addItems([{ name: result.name, kcal: result.kcal, p: result.p, c: result.c, f: result.f }])
            }
            className="mt-3 w-full rounded-lg bg-good py-2.5 text-[13px] font-semibold text-white"
          >
            Log it
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- Scan / capture mock ----------

function ScanView({ mode, addItems }) {
  const demo = foodByName(mode === 'barcode' ? 'Protein bar' : 'Chicken burrito bowl')
  return (
    <div>
      <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-3 bg-black/40">
        <span className="text-[34px]">{mode === 'barcode' ? '║▌║█║▌' : '📸'}</span>
        <p className="mt-2 text-[12px] text-ink-3">
          {mode === 'barcode' ? 'Point at a barcode' : 'Frame your plate'}
        </p>
        <span className="mt-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-[10px] text-ink-3">
          demo — no camera in mockup
        </span>
      </div>
      <button
        onClick={() => addItems([scaled(demo, 1)])}
        className="mt-3 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white"
      >
        Simulate {mode === 'barcode' ? 'scan' : 'capture'} → {demo.emoji} {demo.name}
      </button>
    </div>
  )
}

// ---------- Templates ----------

function TemplatesView({ addItems, remaining }) {
  const [generated, setGenerated] = useState(null)
  return (
    <div className="flex flex-col gap-2">
      {MEAL_TEMPLATES.map((t) => {
        const totals = templateTotals(t)
        return (
          <div key={t.name} className="flex items-center gap-3 rounded-xl bg-surface-3 px-4 py-3">
            <span className="text-[20px]">{t.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">{t.name}</p>
              <p className="truncate text-[11px] text-ink-3">{t.items.join(' · ')}</p>
              <MacroLine kcal={totals.kcal} p={totals.p} c={totals.c} f={totals.f} />
            </div>
            <button
              onClick={() => addItems(t.items.map((n) => scaled(foodByName(n), 1)))}
              className="rounded-lg bg-good px-3 py-2 text-[12px] font-semibold text-white"
            >
              Log
            </button>
          </div>
        )
      })}
      <div className="mt-1 rounded-xl border border-series-1/25 bg-surface-3 px-4 py-3">
        <p className="text-[13px] font-semibold text-ink">✨ Generate from what's left</p>
        <p className="mt-0.5 text-[11px] text-ink-3">
          {remaining.kcal} kcal and {remaining.protein}g protein remaining today
        </p>
        <button
          onClick={() => setGenerated(generateMealForMacros(remaining))}
          className="mt-2 w-full rounded-lg bg-series-1 py-2.5 text-[13px] font-semibold text-white"
        >
          Generate meal
        </button>
        {generated && generated.length === 0 && (
          <p className="mt-3 border-t border-white/5 pt-3 text-center text-[12px] text-ink-3">
            You're at your targets for today — nothing to add 🎉
          </p>
        )}
        {generated && generated.length > 0 && (
          <div className="mt-3 border-t border-white/5 pt-2">
            {generated.map((food, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-[13px] text-ink">
                  {food.emoji} {food.name}
                </span>
                <span className="text-[11px] text-ink-3">{food.kcal} kcal</span>
              </div>
            ))}
            <button
              onClick={() => addItems(generated.map((f) => scaled(f, 1)))}
              className="mt-2 w-full rounded-lg bg-good py-2.5 text-[13px] font-semibold text-white"
            >
              Log all · {generated.reduce((s, f) => s + f.kcal, 0)} kcal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Activity logger ----------

const ACTIVITIES = [
  { type: 'Walk', emoji: '🚶', kcalPerMin: 4.5 },
  { type: 'Run', emoji: '🏃', kcalPerMin: 11 },
  { type: 'Cycle', emoji: '🚴', kcalPerMin: 8.5 },
  { type: 'Swim', emoji: '🏊', kcalPerMin: 10 },
]

function ActivityView({ onLog }) {
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [minutes, setMinutes] = useState(30)
  const kcal = Math.round(activity.kcalPerMin * minutes)
  return (
    <div>
      <div className="flex gap-2">
        {ACTIVITIES.map((a) => (
          <button
            key={a.type}
            onClick={() => setActivity(a)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 ${
              activity.type === a.type ? 'bg-series-1/20 ring-1 ring-series-1' : 'bg-surface-3'
            }`}
          >
            <span className="text-[20px]">{a.emoji}</span>
            <span className="text-[11px] font-medium text-ink-2">{a.type}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setMinutes(Math.max(5, minutes - 5))}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-[19px] text-ink-2"
        >
          −
        </button>
        <div className="text-center">
          <p className="text-[28px] font-bold text-ink">{minutes}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-3">minutes</p>
        </div>
        <button
          onClick={() => setMinutes(minutes + 5)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-[19px] text-ink-2"
        >
          +
        </button>
      </div>
      <button
        onClick={() => onLog({ type: activity.type, minutes, kcal })}
        className="mt-4 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white"
      >
        Log {activity.type.toLowerCase()} · ~{kcal} kcal
      </button>
    </div>
  )
}

// ---------- Shell ----------

const TITLES = {
  search: 'Add food',
  describe: 'Describe it',
  barcode: 'Scan barcode',
  photo: 'Capture meal',
  templates: 'Meal templates',
  activity: 'Log activity',
}

export default function FoodFlows({ view, onClose }) {
  const { days, today, todayKey, dispatch } = useStore()
  const toast = useToast()
  const [current, setCurrent] = useState(view)
  useEffect(() => setCurrent(view), [view])

  const remaining = useMemo(() => {
    const checkIn = weeklyCheckIn(days)
    const targets = macroTargets(checkIn?.newTarget ?? 2050)
    return {
      kcal: Math.max(0, targets.kcal - today.intake.kcal),
      protein: Math.max(0, targets.protein - today.intake.protein),
    }
  }, [days, today])

  function addItems(items) {
    for (const item of items) dispatch({ type: 'addFood', key: todayKey, item })
    const kcal = items.reduce((s, it) => s + it.kcal, 0)
    toast(`Logged ${items.length > 1 ? `${items.length} items` : items[0].name} · +${kcal} kcal`)
    onClose()
  }

  function logActivity(activity) {
    dispatch({ type: 'logActivity', key: todayKey, activity })
    toast(`${activity.type} logged · +${activity.kcal} active kcal`)
    onClose()
  }

  return (
    <Sheet open={current != null} onClose={onClose} title={TITLES[current]}>
      {current === 'search' && (
        <>
          <SearchView addItems={addItems} />
          <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
            {[
              ['barcode', '║▌║ Scan'],
              ['photo', '📸 Capture'],
              ['describe', '✨ Describe'],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setCurrent(v)}
                className="flex-1 rounded-xl bg-surface-3 py-2.5 text-[12px] font-medium text-ink-2"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      {current === 'describe' && <DescribeView addItems={addItems} />}
      {current === 'barcode' && <ScanView mode="barcode" addItems={addItems} />}
      {current === 'photo' && <ScanView mode="photo" addItems={addItems} />}
      {current === 'templates' && <TemplatesView addItems={addItems} remaining={remaining} />}
      {current === 'activity' && <ActivityView onLog={logActivity} />}
    </Sheet>
  )
}
