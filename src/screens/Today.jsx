// Whoop/Bevel-style daily dashboard: week strip → Recovery hero with
// contributor deltas → strain vs recovery-informed target → sleep
// performance with stages — plus this app's readiness and weigh-in loops.

import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { longDate, keyToDate } from '../lib/dates'
import {
  scoreSeries,
  sleepScore,
  readiness,
  trendWeightSeries,
  tdeeAt,
  metricBaseline,
} from '../lib/derived'
import { Card, Chip, SectionTitle, scoreBand, useToast } from '../components/ui'
import ArcGauge from '../components/ArcGauge'
import Sheet from '../components/Sheet'

const STAGE_COLORS = {
  deep: '#184f95',
  rem: '#3987e5',
  light: '#86b6ef',
  awake: '#898781',
}

function fmtHours(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function fmtMins(mins) {
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`
}

function DeltaChip({ delta, goodWhenUp, unit = '' }) {
  if (delta == null) return null
  const neutral = Math.abs(delta) < 2
  const favorable = (delta > 0) === goodWhenUp
  const color = neutral ? 'text-ink-3' : favorable ? 'text-good' : 'text-serious'
  return (
    <span className={`text-[11px] font-semibold ${color}`}>
      {neutral ? '→' : delta > 0 ? '↑' : '↓'} {Math.abs(delta)}
      {unit}
    </span>
  )
}

function strainBand(rec) {
  if (rec >= 80) return [60, 80]
  if (rec >= 67) return [50, 70]
  if (rec >= 55) return [40, 60]
  return [25, 45]
}

export default function Today({ onNavigate, onOpenWeight }) {
  const { days, todayKey, plannedSession, dispatch } = useStore()
  const toast = useToast()
  const [sheet, setSheet] = useState(null)
  const [selected, setSelected] = useState(null) // index into days, null = today
  const [weightInput, setWeightInput] = useState('')
  const [flashWeigh, setFlashWeigh] = useState(false)

  const idx = selected ?? days.length - 1
  const day = days[idx]
  const isToday = idx === days.length - 1

  const recSeries = useMemo(() => scoreSeries(days, 'recovery'), [days])
  const strainSeries = useMemo(() => scoreSeries(days, 'strain'), [days])
  const rec = recSeries[idx].value
  const strain = strainSeries[idx].value
  const recBand = scoreBand('recovery', rec)

  const sleepScores = useMemo(() => days.map((d) => sleepScore(d)), [days])
  const sleepBase = useMemo(() => {
    const prior = sleepScores.slice(Math.max(0, idx - 28), idx)
    return prior.length ? prior.reduce((s, v) => s + v, 0) / prior.length : null
  }, [sleepScores, idx])

  const contributors = useMemo(
    () => [
      {
        label: 'HRV',
        value: `${day.hrv} ms`,
        delta: Math.round(day.hrv - (metricBaseline(days, idx, 'hrv') ?? day.hrv)),
        goodWhenUp: true,
      },
      {
        label: 'Resting HR',
        value: `${day.rhr} bpm`,
        delta: Math.round(day.rhr - (metricBaseline(days, idx, 'rhr') ?? day.rhr)),
        goodWhenUp: false,
      },
      {
        label: 'Sleep',
        value: `${sleepScores[idx]}`,
        delta: sleepBase != null ? Math.round(sleepScores[idx] - sleepBase) : null,
        goodWhenUp: true,
      },
    ],
    [day, days, idx, sleepScores, sleepBase],
  )

  const ready = useMemo(
    () => readiness(days, day.session ? null : plannedSession?.dayName),
    [days, day, plannedSession],
  )

  const band = strainBand(rec)
  const strainStatus =
    strain < band[0] ? 'Room to push' : strain <= band[1] ? 'On target' : 'Over target'

  const sleepPerf = Math.min(100, Math.round((day.sleep.hours / 8) * 100))
  const stageTotal =
    day.sleep.stages.deep + day.sleep.stages.rem + day.sleep.stages.light + day.sleep.stages.awake

  const trend = useMemo(() => trendWeightSeries(days), [days])
  const lastTrend = [...trend].reverse().find((t) => t.trend != null)
  const tdee = useMemo(() => tdeeAt(days, days.length - 1), [days])
  const hasWeighedIn = days[days.length - 1].weightLb != null

  function saveWeighIn() {
    const w = parseFloat(weightInput)
    if (!w || w < 80 || w > 400) return
    const before = { trend: lastTrend?.trend, tdee }
    dispatch({ type: 'addWeighIn', key: todayKey, weightLb: Math.round(w * 10) / 10 })
    setFlashWeigh(true)
    setTimeout(() => setFlashWeigh(false), 1200)
    const merged = days.map((d) => (d.key === todayKey ? { ...d, weightLb: w } : d))
    const after = {
      trend: trendWeightSeries(merged).reverse().find((t) => t.trend != null)?.trend,
      tdee: tdeeAt(merged, merged.length - 1),
    }
    const dTdee = after.tdee != null && before.tdee != null ? after.tdee - before.tdee : 0
    toast(
      `Trend ${before.trend?.toFixed(1)} → ${after.trend?.toFixed(1)} lb · TDEE ${dTdee >= 0 ? '+' : ''}${dTdee} kcal`,
    )
  }

  const weekDays = days.slice(-7)

  return (
    <div className="pt-2">
      <header className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-[12px] font-medium text-ink-3">{longDate(day.key)}</p>
          <h1 className="text-[22px] font-bold text-ink">
            {isToday ? 'Good morning, Ethan' : keyToDate(day.key).toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-series-1/20 text-[15px] font-bold text-series-1"
          aria-label="Profile"
        >
          E
        </button>
      </header>

      {/* Week strip — tap a day to review it */}
      <div className="mb-4 flex justify-between px-1">
        {weekDays.map((d, i) => {
          const dayIdx = days.length - 7 + i
          const r = recSeries[dayIdx].value
          const b = scoreBand('recovery', r)
          const active = dayIdx === idx
          return (
            <button
              key={d.key}
              onClick={() => setSelected(dayIdx === days.length - 1 ? null : dayIdx)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 ${active ? 'bg-surface' : ''}`}
            >
              <span className={`text-[10px] font-medium ${active ? 'text-ink' : 'text-ink-3'}`}>
                {keyToDate(d.key).toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  color: active ? '#fff' : b.color,
                  background: active ? b.color : `color-mix(in srgb, ${b.color} 16%, transparent)`,
                }}
              >
                {r}
              </span>
            </button>
          )
        })}
      </div>

      {/* Recovery hero */}
      <Card onClick={() => setSheet('recovery')} className="!p-5">
        <div className="flex flex-col items-center">
          <ArcGauge value={rec} color={recBand.color} size={158}>
            <span className="text-[42px] font-bold leading-none text-ink">{rec}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-ink-3">
              Recovery
            </span>
            <Chip tone={recBand.tone} className="mt-1.5">
              {recBand.label}
            </Chip>
          </ArcGauge>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {contributors.map((c) => (
            <div key={c.label} className="rounded-xl bg-surface-2 px-2 py-2.5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-3">{c.label}</p>
              <p className="mt-0.5 text-[15px] font-bold text-ink">{c.value}</p>
              <DeltaChip delta={c.delta} goodWhenUp={c.goodWhenUp} />
            </div>
          ))}
        </div>
        {isToday && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate('train')
            }}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
          >
            <span className="text-[13px] font-medium text-ink">{ready.title}</span>
            <span className="text-series-1">→</span>
          </button>
        )}
      </Card>

      {/* Strain vs target */}
      <Card onClick={() => setSheet('strain')} className="mt-3 !p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-ink">Strain</p>
          <span
            className={`text-[12px] font-semibold ${
              strainStatus === 'On target'
                ? 'text-good'
                : strainStatus === 'Over target'
                  ? 'text-serious'
                  : 'text-ink-3'
            }`}
          >
            {strainStatus}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[30px] font-bold leading-none text-ink">{strain}</span>
          <span className="text-[12px] text-ink-3">
            target {band[0]}–{band[1]}
          </span>
        </div>
        <div className="relative mt-3 h-2.5 rounded-full bg-surface-3">
          <div
            className="absolute inset-y-0 rounded-full bg-white/10"
            style={{ left: `${band[0]}%`, width: `${band[1] - band[0]}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-series-1"
            style={{ width: `${strain}%` }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-surface bg-series-1"
            style={{ left: `calc(${strain}% - 8px)` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-center">
          {[
            [day.activeCal, 'active kcal'],
            [day.zoneMinutes, 'zone min'],
            [`${(day.steps / 1000).toFixed(1)}k`, 'steps'],
          ].map(([v, label]) => (
            <div key={label}>
              <p className="text-[15px] font-bold text-ink">{v}</p>
              <p className="text-[10px] text-ink-3">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Sleep performance */}
      <Card onClick={() => setSheet('sleep')} className="mt-3 !p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-ink">Sleep</p>
          <span className="text-[12px] text-ink-3">{day.sleep.bedtime} bedtime</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[30px] font-bold leading-none text-ink">{sleepPerf}%</span>
          <span className="text-[12px] text-ink-3">{fmtHours(day.sleep.hours)} of 8h</span>
        </div>
        <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full">
          {['deep', 'rem', 'light', 'awake'].map((stage) => (
            <div
              key={stage}
              style={{
                width: `${(day.sleep.stages[stage] / stageTotal) * 100}%`,
                background: STAGE_COLORS[stage],
              }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex justify-between">
          {[
            ['deep', 'Deep'],
            ['rem', 'REM'],
            ['light', 'Light'],
            ['awake', 'Awake'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[key] }} />
              <span className="text-[10px] text-ink-3">
                {label} <span className="font-semibold text-ink-2">{fmtMins(day.sleep.stages[key])}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Vitals */}
      <div className="mt-3 flex gap-2">
        {[
          ['SpO2', `${day.spo2}%`],
          ['Resp', `${day.respRate}`],
          ['Skin temp', `${day.skinTempDelta > 0 ? '+' : ''}${day.skinTempDelta}°`],
        ].map(([label, v]) => (
          <div key={label} className="flex-1 rounded-xl bg-surface px-2 py-3 text-center shadow-md shadow-black/20 ring-1 ring-white/[0.04]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-3">{label}</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>

      {/* Weigh-in (today only) */}
      {isToday && (
        <>
          <SectionTitle>Weigh-in</SectionTitle>
          <Card flash={flashWeigh}>
            {hasWeighedIn ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-ink-3">Today's scale weight</p>
                  <p className="text-[22px] font-bold text-ink">
                    {days[days.length - 1].weightLb.toFixed(1)} lb
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-ink-3">Trend</p>
                  <p className="text-[22px] font-bold text-series-1">{lastTrend?.trend.toFixed(1)}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  placeholder={lastTrend ? lastTrend.trend.toFixed(1) : '146.0'}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-24 rounded-xl bg-surface-2 px-3 py-2.5 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-3"
                />
                <button
                  onClick={saveWeighIn}
                  className="flex-1 rounded-xl bg-series-1 py-2.5 text-[14px] font-semibold text-white active:scale-[0.98] transition-transform"
                >
                  Save weigh-in
                </button>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-[12px] text-ink-3">
                Trend {lastTrend?.trend.toFixed(1)} lb · TDEE {tdee?.toLocaleString()} kcal
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenWeight()
                }}
                className="text-[12px] font-semibold text-series-1"
              >
                Details →
              </button>
            </div>
          </Card>
        </>
      )}

      <Sheet open={sheet === 'recovery'} onClose={() => setSheet(null)} title="Recovery">
        <p>
          45% HRV vs your 28-day baseline + 30% resting HR vs baseline + 25% last night's sleep.
          It gates the day's training suggestion.
        </p>
      </Sheet>
      <Sheet open={sheet === 'strain'} onClose={() => setSheet(null)} title="Strain">
        <p>
          Active calories, zone minutes and completed sets, scaled 0–100. The target band comes
          from today's recovery — recover well, earn a bigger day.
        </p>
      </Sheet>
      <Sheet open={sheet === 'sleep'} onClose={() => setSheet(null)} title="Sleep">
        <p>
          Duration against an 8h need (55%), deep + REM share (30%), time awake (15%). Synced
          from Fitbit via Health Connect.
        </p>
      </Sheet>
    </div>
  )
}
