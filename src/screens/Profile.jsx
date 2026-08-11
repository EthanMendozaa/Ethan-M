import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { trendWeightSeries } from '../lib/derived'
import { Card, Chip, SectionTitle, useToast } from '../components/ui'
import Sheet from '../components/Sheet'

const DATAPOINTS = [
  'Steps',
  'Distance',
  'Floors climbed',
  'Active calories',
  'Total calories',
  'Heart rate',
  'Heart rate variability',
  'Sleep stages',
  'SpO2',
  'Respiratory rate',
  'Skin temperature',
  'Active zone minutes',
  'VO2max estimate',
  'Weight',
  'Body fat %',
  'Exercise sessions',
]

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-series-1' : 'bg-surface-3'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function Row({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-hairline py-3 text-left last:border-0"
    >
      <span className="text-[14px] text-ink">{label}</span>
      <span className="flex items-center gap-1 text-[13px] text-ink-3">
        {value} {onClick && '›'}
      </span>
    </button>
  )
}

export default function Profile() {
  const { days, userState, dispatch, resetDemo } = useStore()
  const toast = useToast()
  const [sheet, setSheet] = useState(null)
  const [toggles, setToggles] = useState(() => Object.fromEntries(DATAPOINTS.map((d) => [d, true])))

  const trend = useMemo(() => {
    const t = trendWeightSeries(days)
    return [...t].reverse().find((x) => x.trend != null)?.trend
  }, [days])

  const units = userState.settings.units

  return (
    <div className="pt-2">
      <header className="mb-4 flex items-center gap-3 px-1">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-series-1/20 text-[20px] font-bold text-series-1">
          E
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-ink">Ethan</h1>
          <p className="text-[12px] text-ink-3">5'10" · {trend?.toFixed(1)} lb trend</p>
        </div>
      </header>

      <SectionTitle>Goals</SectionTitle>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">Cut → lean bulk</p>
            <p className="mt-0.5 text-[12px] text-ink-2">
              Finish cut at goal weight, then bulk toward 160 lb
            </p>
          </div>
          <Chip tone="accent">Cutting</Chip>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
          <div>
            <p className="text-[16px] font-bold text-ink">−1.0</p>
            <p className="text-[10px] text-ink-3">lb / week</p>
          </div>
          <div>
            <p className="text-[16px] font-bold text-ink">145.0</p>
            <p className="text-[10px] text-ink-3">cut goal (lb)</p>
          </div>
          <div>
            <p className="text-[16px] font-bold text-ink">160</p>
            <p className="text-[10px] text-ink-3">bulk target (lb)</p>
          </div>
        </div>
      </Card>

      <SectionTitle>Integrations</SectionTitle>
      <Card onClick={() => setSheet('health')} className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-ink">Google Health Connect (Fitbit)</p>
          <p className="text-[12px] text-ink-3">{DATAPOINTS.length} data types syncing</p>
        </div>
        <Chip tone="good">Connected ✓</Chip>
      </Card>
      <Card className="mt-2 flex items-center justify-between py-3">
        <p className="text-[14px] text-ink-2">Apple Health</p>
        <Chip>Not connected</Chip>
      </Card>
      <Card className="mt-2 flex items-center justify-between py-3">
        <p className="text-[14px] text-ink-2">Manual entry</p>
        <Chip>Available</Chip>
      </Card>

      <SectionTitle>Settings</SectionTitle>
      <Card>
        <Row
          label="Active program"
          value="Arnold Split"
          onClick={() => toast('Manage programs in the Train tab')}
        />
        <div className="flex w-full items-center justify-between border-b border-hairline py-3">
          <span className="text-[14px] text-ink">Units</span>
          <div className="flex overflow-hidden rounded-lg bg-surface-2">
            {['lb', 'kg'].map((u) => (
              <button
                key={u}
                onClick={() => {
                  dispatch({ type: 'setSettings', settings: { units: u } })
                  if (u === 'kg') toast('Mockup displays imperial — kg noted!')
                }}
                className={`px-3 py-1 text-[12px] font-medium ${units === u ? 'bg-series-1 text-white' : 'text-ink-3'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full items-center justify-between py-3">
          <span className="text-[14px] text-ink">Notifications</span>
          <Toggle
            on={userState.settings.notifications}
            onChange={() =>
              dispatch({
                type: 'setSettings',
                settings: { notifications: !userState.settings.notifications },
              })
            }
          />
        </div>
      </Card>

      <SectionTitle>Demo</SectionTitle>
      <Card>
        <p className="text-[12px] leading-snug text-ink-3">
          This is an interactive mockup running on 90 days of seeded data. Your weigh-ins, logged
          foods and completed workouts overlay it locally.
        </p>
        <button
          onClick={() => {
            resetDemo()
            toast('Demo data reset')
          }}
          className="mt-3 w-full rounded-xl bg-surface-3 py-3 text-[14px] font-semibold text-critical"
        >
          Reset demo data
        </button>
      </Card>

      <Sheet open={sheet === 'health'} onClose={() => setSheet(null)} title="Google Health Connect">
        <p className="mb-3 text-[13px]">
          Fitbit Charge 6 · last sync 8:02 AM. Toggle the data types this app can read:
        </p>
        <div className="flex flex-col">
          {DATAPOINTS.map((d) => (
            <div key={d} className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
              <span className="text-[13px] text-ink-2">{d}</span>
              <Toggle on={toggles[d]} onChange={() => setToggles((t) => ({ ...t, [d]: !t[d] }))} />
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
