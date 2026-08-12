import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { longDate } from '../lib/dates'
import {
  scoreSeries,
  readiness,
  trendWeightSeries,
  tdeeAt,
} from '../lib/derived'
import { Card, Chip, SectionTitle, scoreBand, useToast } from '../components/ui'
import ScoreRing from '../components/ScoreRing'
import Sparkline from '../components/Sparkline'
import Sheet from '../components/Sheet'

const SCORE_EXPLAINERS = {
  recovery: {
    name: 'Recovery',
    body: 'Recovery blends how today’s HRV and resting heart rate compare to your 28-day baselines (45% + 30%) with last night’s sleep score (25%). It gates today’s training suggestion.',
  },
  sleep: {
    name: 'Sleep',
    body: 'Sleep scores duration against an 8h need (55%), the share of deep + REM sleep (30%), and how little of the night you spent awake (15%).',
  },
  strain: {
    name: 'Strain',
    body: 'Strain is a load measure, not good or bad: active calories (45%), zone minutes (25%), and completed working sets (30%) scaled 0–100. Hard days should be high.',
  },
  stress: {
    name: 'Stress',
    body: 'Stress rises when HRV is depressed vs baseline (40%), resting HR is elevated (30%), sleep ran short (20%), or skin temperature deviates (10%). Lower is calmer.',
  },
}

function ScoreCard({ kind, value, spark, onOpen }) {
  const band = scoreBand(kind, value)
  return (
    <Card onClick={onOpen} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-3">{SCORE_EXPLAINERS[kind].name}</span>
        <Chip tone={band.tone}>{band.label}</Chip>
      </div>
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center">
          <ScoreRing value={value} color={band.color} size={62} />
          <span className="absolute text-[19px] font-bold text-ink">{value}</span>
        </div>
        <Sparkline data={spark} accent={band.color} />
      </div>
    </Card>
  )
}

function Vital({ label, value, unit }) {
  return (
    <div className="flex min-w-[86px] flex-col gap-0.5 rounded-xl bg-surface p-3">
      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-3">{label}</span>
      <span className="text-[16px] font-semibold text-ink">
        {value}
        <span className="ml-0.5 text-[11px] font-normal text-ink-3">{unit}</span>
      </span>
    </div>
  )
}

export default function Today({ onNavigate, onOpenWeight }) {
  const { days, today, plannedSession, dispatch, todayKey } = useStore()
  const toast = useToast()
  const [sheet, setSheet] = useState(null)
  const [weightInput, setWeightInput] = useState('')
  const [flashWeigh, setFlashWeigh] = useState(false)

  const scores = useMemo(() => {
    const out = {}
    for (const kind of ['recovery', 'sleep', 'strain', 'stress']) {
      const s = scoreSeries(days, kind)
      out[kind] = { value: s[s.length - 1].value, spark: s.slice(-7).map((p) => p.value) }
    }
    return out
  }, [days])

  const ready = useMemo(
    () => readiness(days, today.session ? null : plannedSession?.dayName),
    [days, today, plannedSession],
  )

  const trend = useMemo(() => trendWeightSeries(days), [days])
  const lastTrend = [...trend].reverse().find((t) => t.trend != null)
  const tdee = useMemo(() => tdeeAt(days, days.length - 1), [days])
  const hasWeighedIn = today.weightLb != null

  function saveWeighIn() {
    const w = parseFloat(weightInput)
    if (!w || w < 80 || w > 400) return
    const before = { trend: lastTrend?.trend, tdee }
    dispatch({ type: 'addWeighIn', key: todayKey, weightLb: Math.round(w * 10) / 10 })
    setFlashWeigh(true)
    setTimeout(() => setFlashWeigh(false), 1200)
    // Recompute on the merged copy to show the visible nudge immediately.
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

  const readyTone =
    ready.tone === 'high' ? 'good' : ready.tone === 'low' ? 'warning' : 'accent'

  return (
    <div className="pt-2">
      <header className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-ink-3">{longDate(todayKey)}</p>
            <h1 className="text-[24px] font-bold text-ink">Good morning, Ethan</h1>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-series-1/20 text-[15px] font-bold text-series-1"
            aria-label="Profile"
          >
            E
          </button>
        </div>
        <button
          onClick={() => setSheet('sync')}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-good" />
          Fitbit via Health Connect · synced 8:02 AM
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {['recovery', 'sleep', 'strain', 'stress'].map((kind) => (
          <ScoreCard
            key={kind}
            kind={kind}
            value={scores[kind].value}
            spark={scores[kind].spark}
            onOpen={() => setSheet(kind)}
          />
        ))}
      </div>

      <Card className="mt-3 border border-white/5" onClick={() => onNavigate('train')}>
        <div className="flex items-center justify-between">
          <Chip tone={readyTone}>Readiness</Chip>
          <span className="text-[11px] text-ink-3">Tap to train →</span>
        </div>
        <h3 className="mt-2 text-[16px] font-semibold text-ink">{ready.title}</h3>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">{ready.detail}</p>
      </Card>

      <SectionTitle>Vitals</SectionTitle>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Vital label="Resting HR" value={today.rhr} unit="bpm" />
        <Vital label="HRV" value={today.hrv} unit="ms" />
        <Vital label="SpO2" value={today.spo2} unit="%" />
        <Vital label="Resp rate" value={today.respRate} unit="/min" />
        <Vital
          label="Skin temp"
          value={`${today.skinTempDelta > 0 ? '+' : ''}${today.skinTempDelta}`}
          unit="°F"
        />
      </div>

      <SectionTitle>Activity</SectionTitle>
      <Card className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <ScoreRing
            value={Math.min(100, (today.steps / 15000) * 100)}
            color="var(--color-series-3)"
            size={78}
            stroke={7}
          />
          <div className="absolute flex flex-col items-center">
            <span className="text-[15px] font-bold text-ink">
              {(today.steps / 1000).toFixed(1)}k
            </span>
            <span className="text-[9px] text-ink-3">of 15k</span>
          </div>
        </div>
        <div className="flex flex-1 justify-around">
          <div className="text-center">
            <p className="text-[18px] font-bold text-ink">{today.activeCal}</p>
            <p className="text-[11px] text-ink-3">active kcal</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-ink">{today.zoneMinutes}</p>
            <p className="text-[11px] text-ink-3">zone min</p>
          </div>
        </div>
      </Card>

      <SectionTitle>Weigh-in</SectionTitle>
      <Card flash={flashWeigh}>
        {hasWeighedIn ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink-3">Today’s scale weight</p>
              <p className="text-[22px] font-bold text-ink">{today.weightLb.toFixed(1)} lb</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-ink-3">Trend</p>
              <p className="text-[22px] font-bold text-series-1">{lastTrend?.trend.toFixed(1)}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-ink-2">
              Log today’s weight — trend and expenditure update instantly.
            </p>
            <div className="mt-3 flex gap-2">
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
          </>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-[12px] text-ink-3">
            Trend {lastTrend?.trend.toFixed(1)} lb · TDEE {tdee?.toLocaleString()} kcal
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSheet('weigh')} className="text-[12px] font-medium text-ink-3">
              Why?
            </button>
            <button onClick={onOpenWeight} className="text-[12px] font-semibold text-series-1">
              Details →
            </button>
          </div>
        </div>
      </Card>

      {Object.keys(SCORE_EXPLAINERS).map((kind) => (
        <Sheet
          key={kind}
          open={sheet === kind}
          onClose={() => setSheet(null)}
          title={`How ${SCORE_EXPLAINERS[kind].name} works`}
        >
          <p>{SCORE_EXPLAINERS[kind].body}</p>
          <p className="mt-3 text-ink-3">
            Today: <span className="font-semibold text-ink">{scores[kind].value}</span> · 7-day
            range {Math.min(...scores[kind].spark)}–{Math.max(...scores[kind].spark)}
          </p>
        </Sheet>
      ))}
      <Sheet open={sheet === 'weigh'} onClose={() => setSheet(null)} title="Why did this change?">
        <p>
          Trend weight is an exponentially-weighted average (α = 0.25) of your scale weights, so
          one salty dinner can’t hide real progress. Expenditure (TDEE) is estimated from your
          last 14 days of logged intake and the trend-weight change over the same window — every
          weigh-in and food log refines it.
        </p>
      </Sheet>
      <Sheet open={sheet === 'sync'} onClose={() => setSheet(null)} title="Connected data">
        <p>
          This mockup simulates a Fitbit stream via Health Connect: steps, distance, floors,
          calories, heart rate, HRV, sleep stages, SpO2, respiratory rate, skin temperature,
          zone minutes, VO2max, weight and body fat. Manage it under Profile → Integrations.
        </p>
      </Sheet>
    </div>
  )
}
