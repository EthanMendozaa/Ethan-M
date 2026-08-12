// Strategy page (MacroFactor-style): current goal with rates, a Check-In
// that produces a Program Update (next week's macro plan + what changed,
// Accept/Decline), the in-progress macro plan, and goal history.

import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { shortDate, addDays } from '../lib/dates'
import { trendWeightSeries, macroTargets } from '../lib/derived'
import { calorieCoach, REFERENCES } from '../lib/engine'
import { Card, Chip, SectionTitle, useToast } from '../components/ui'
import Sheet from '../components/Sheet'

const PHASE_META = {
  cut: { title: 'Weight Loss Goal', chip: 'Cutting', word: 'Lose', emoji: '🔥' },
  maintain: { title: 'Maintenance Goal', chip: 'Holding', word: 'Maintain', emoji: '⚖️' },
  bulk: { title: 'Weight Gain Goal', chip: 'Bulking', word: 'Gain', emoji: '💪' },
}

const RATE_OPTIONS = { cut: [-0.5, -1.0, -1.5], maintain: [0], bulk: [0.25, 0.5] }

const DAYS_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// 7-day macro plan columns: kcal pill, then P/F/C blocks sized by kcal share.
function MacroColumns({ kcal }) {
  const t = macroTargets(kcal)
  const pK = t.protein * 4
  const fK = t.fat * 9
  const cK = t.carbs * 4
  const total = Math.max(1, pK + fK + cK)
  const H = 150
  const blocks = [
    { label: `${t.protein} P`, h: (pK / total) * H, bg: '#d95926' },
    { label: `${t.fat} F`, h: (fK / total) * H, bg: '#c98500' },
    { label: `${t.carbs} C`, h: (cK / total) * H, bg: '#199e70' },
  ]
  return (
    <div className="flex justify-between gap-1.5">
      {DAYS_HEADER.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="rounded-full bg-series-1 px-1 py-0.5 text-[9px] font-bold text-white">
            {kcal}
          </span>
          {blocks.map((b) => (
            <div
              key={b.label}
              className="flex w-full items-center justify-center rounded-md text-[9px] font-bold text-white/90"
              style={{ height: b.h, background: b.bg }}
            >
              {b.label}
            </div>
          ))}
          <span className="text-[10px] text-ink-3">{d}</span>
        </div>
      ))}
    </div>
  )
}

export default function GoalPage({ onClose }) {
  const { days, todayKey, dispatch, userState } = useStore()
  const toast = useToast()
  const [view, setView] = useState('main') // main | update
  const [editor, setEditor] = useState(null) // { isNew, draft }
  const [whySheet, setWhySheet] = useState(false)

  const goal = userState.goal ?? { phase: 'cut', goalWeight: 145, weeklyRateLb: -0.96 }
  const calorieTarget = userState.calorieTarget ?? 2050
  const coach = useMemo(() => calorieCoach(days, calorieTarget, goal), [days, calorieTarget, goal])

  const trend = useMemo(() => trendWeightSeries(days).filter((t) => t.trend != null), [days])
  const bw = trend[trend.length - 1]?.trend
  const startKey = goal.startKey ?? days[0].key
  const ratePct = bw ? Math.round((Math.abs(goal.weeklyRateLb) / bw) * 1000) / 10 : 0

  const hasSuggestion =
    (coach.status === 'suggest' || coach.status === 'goal-reached') && coach.suggested != null

  // History: archived entries + a canned pre-seed phase so the list feels lived-in
  const history = useMemo(() => {
    const archived = userState.goalHistory ?? []
    const canned = archived.length
      ? []
      : [
          {
            phase: 'maintain',
            startKey: addDays(days[0].key, -21),
            endKey: days[0].key,
            startWeight: 158.4,
            endWeight: 158.0,
          },
        ]
    const current = {
      phase: goal.phase,
      startKey,
      endKey: null,
      startWeight: trend[0]?.trend,
      endWeight: bw,
      active: true,
    }
    return [current, ...[...archived].reverse(), ...canned]
  }, [userState.goalHistory, goal, startKey, trend, bw, days])

  function openEditor(isNew) {
    setEditor({
      isNew,
      draft: isNew
        ? { phase: 'maintain', goalWeight: Math.round(bw ?? 150), weeklyRateLb: 0 }
        : { ...goal },
    })
  }

  function saveGoal() {
    const { isNew, draft } = editor
    const archive = isNew
      ? {
          phase: goal.phase,
          startKey,
          endKey: todayKey,
          startWeight: trend[0]?.trend,
          endWeight: bw,
        }
      : undefined
    dispatch({
      type: 'setGoal',
      goal: {
        ...draft,
        weeklyRateLb: draft.phase === 'maintain' ? 0 : draft.weeklyRateLb,
        startKey: isNew ? todayKey : startKey,
      },
      archive,
    })
    setEditor(null)
    toast(isNew ? 'New goal started' : 'Goal updated')
  }

  function acceptUpdate() {
    dispatch({ type: 'setCalorieTarget', target: coach.suggested })
    toast(`Program updated — ${coach.suggested.toLocaleString()} kcal/day`)
    setView('main')
  }

  // ── Program Update view ──────────────────────────────────────────────
  if (view === 'update' && hasSuggestion) {
    const oldT = macroTargets(calorieTarget)
    const newT = macroTargets(coach.suggested)
    const changes = [
      ['🔥', 'Calories', coach.suggested - calorieTarget, 'kcal'],
      ['P', 'Protein', newT.protein - oldT.protein, 'g'],
      ['F', 'Fat', newT.fat - oldT.fat, 'g'],
      ['C', 'Carbs', newT.carbs - oldT.carbs, 'g'],
    ]
    return (
      <div className="absolute inset-0 z-20 flex flex-col bg-page">
        <header className="flex items-center justify-between px-5 pb-3 pt-14">
          <button onClick={() => setView('main')} className="flex items-center gap-1 text-[14px] text-ink-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14.5 5 8 12l6.5 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <p className="text-[16px] font-bold text-ink">Program update</p>
          <span className="w-14" />
        </header>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
          <Card className="!p-5">
            <p className="mb-4 text-center text-[15px] font-semibold text-ink">
              Next week's plan
            </p>
            <MacroColumns kcal={coach.suggested} />
          </Card>
          <SectionTitle>What changed</SectionTitle>
          <Card className="!p-2">
            {changes.map(([icon, label, delta, unit]) => (
              <div key={label} className="flex items-center gap-3 border-b border-hairline px-3 py-3 last:border-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[13px] font-bold text-ink">
                  {icon}
                </span>
                <span className="flex-1 text-[14px] text-ink-2">{label}</span>
                <span
                  className={`text-[15px] font-bold ${
                    delta === 0 ? 'text-ink-3' : delta > 0 ? 'text-good' : 'text-serious'
                  }`}
                >
                  {delta > 0 ? '+' : ''}
                  {delta} {unit}
                </span>
              </div>
            ))}
          </Card>
          <p className="mt-3 px-1 text-[12px] leading-snug text-ink-3">
            {coach.observedRate} lb/wk vs {coach.targetRate} target ·{' '}
            <button onClick={() => setWhySheet(true)} className="font-medium text-series-1">
              Why?
            </button>
          </p>
        </div>
        <div className="flex flex-col gap-2 px-5 pb-10">
          <button
            onClick={acceptUpdate}
            className="w-full rounded-xl bg-white py-3.5 text-[15px] font-semibold text-black active:scale-[0.98] transition-transform"
          >
            Accept program changes
          </button>
          <button
            onClick={() => setView('main')}
            className="w-full rounded-xl bg-surface-2 py-3 text-[14px] font-medium text-ink-2"
          >
            Not now
          </button>
        </div>
        <Sheet open={whySheet} onClose={() => setWhySheet(false)} title="How this was computed">
          <div className="flex flex-col gap-2">
            {coach.rationale?.map((r, i) => (
              <div key={i} className="rounded-xl bg-surface-3 px-3.5 py-2.5">
                <p className="text-[13px] leading-snug text-ink">{r.text}</p>
                {REFERENCES[r.ref] && (
                  <p className="mt-1 text-[10px] leading-snug text-ink-3">{REFERENCES[r.ref]}</p>
                )}
              </div>
            ))}
          </div>
        </Sheet>
      </div>
    )
  }

  // ── Main strategy view ───────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-page">
      <header className="flex items-center justify-between px-5 pb-3 pt-14">
        <button onClick={onClose} className="flex items-center gap-1 text-[14px] text-ink-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14.5 5 8 12l6.5 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <p className="text-[16px] font-bold text-ink">Strategy</p>
        <span className="w-14" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        {/* Current goal */}
        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[16px] font-bold text-ink">{PHASE_META[goal.phase].title}</p>
              <p className="text-[11px] text-ink-3">{shortDate(startKey)} – Now</p>
            </div>
            <Chip tone="accent">{PHASE_META[goal.phase].chip}</Chip>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[24px] font-bold text-ink">
                {goal.phase === 'maintain' ? '—' : goal.goalWeight}
              </p>
              <p className="text-[10px] text-ink-3">goal weight (lb)</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-ink">
                {goal.weeklyRateLb > 0 ? '+' : ''}
                {goal.weeklyRateLb}
              </p>
              <p className="text-[10px] text-ink-3">lb / week</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-ink">
                {goal.weeklyRateLb === 0 ? '0' : `${goal.weeklyRateLb > 0 ? '+' : '−'}${ratePct}`}
                <span className="text-[13px]">%</span>
              </p>
              <p className="text-[10px] text-ink-3">BW / week</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 border-t border-hairline pt-3">
            <button
              onClick={() => openEditor(true)}
              className="flex-1 rounded-xl bg-surface-2 py-2.5 text-[13px] font-semibold text-ink"
            >
              + New goal
            </button>
            <button
              onClick={() => openEditor(false)}
              className="flex-1 rounded-xl bg-surface-2 py-2.5 text-[13px] font-semibold text-ink"
            >
              ✎ Edit goal
            </button>
          </div>
        </Card>

        {/* Check-in */}
        <div className="my-7 flex justify-center">
          <button
            onClick={() => hasSuggestion && setView('update')}
            className={`flex h-44 w-44 flex-col items-center justify-center rounded-full transition-transform active:scale-95 ${
              hasSuggestion ? 'bg-white shadow-xl shadow-white/10' : 'bg-surface'
            }`}
          >
            <span className={`text-[22px] font-extrabold tracking-tight ${hasSuggestion ? 'text-black' : 'text-ink-3'}`}>
              CHECK IN
            </span>
            <span className={`text-[13px] ${hasSuggestion ? 'text-black/60' : 'text-ink-3'}`}>
              {hasSuggestion ? "it's time" : 'on plan'}
            </span>
          </button>
        </div>

        {/* Current program */}
        <SectionTitle>In progress</SectionTitle>
        <Card className="!p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-[14px] font-semibold text-ink">Coached plan</p>
            <p className="text-[11px] text-ink-3">{shortDate(startKey)} – Now</p>
          </div>
          <MacroColumns kcal={calorieTarget} />
        </Card>

        {/* Goal history */}
        <SectionTitle>Goal history</SectionTitle>
        <div className="flex flex-col gap-2">
          {history.map((h, i) => (
            <Card key={i} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-[11px] text-ink-3">
                  {shortDate(h.startKey)} – {h.endKey ? shortDate(h.endKey) : 'Now'}
                </p>
                <p className="mt-0.5 text-[15px] font-bold text-ink">
                  {h.startWeight?.toFixed(1)}
                  {h.endWeight != null && !h.active && (
                    <span className="font-normal text-ink-3"> to </span>
                  )}
                  {!h.active && h.endWeight != null && h.endWeight.toFixed(1)} lbs
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
                {PHASE_META[h.phase].word}
                <span>{h.active ? '⏳' : '✓'}</span>
              </span>
            </Card>
          ))}
        </div>
      </div>

      {/* Goal editor */}
      <Sheet
        open={editor != null}
        onClose={() => setEditor(null)}
        title={editor?.isNew ? 'New goal' : 'Edit goal'}
      >
        {editor && (
          <>
            <div className="flex flex-col gap-2">
              {Object.entries(PHASE_META).map(([phase, meta]) => (
                <button
                  key={phase}
                  onClick={() =>
                    setEditor({
                      ...editor,
                      draft: {
                        ...editor.draft,
                        phase,
                        weeklyRateLb: RATE_OPTIONS[phase].includes(editor.draft.weeklyRateLb)
                          ? editor.draft.weeklyRateLb
                          : RATE_OPTIONS[phase][RATE_OPTIONS[phase].length > 1 ? 1 : 0],
                      },
                    })
                  }
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left ${
                    editor.draft.phase === phase
                      ? 'bg-series-1/15 ring-1 ring-series-1'
                      : 'bg-surface-3'
                  }`}
                >
                  <span className="text-[18px]">{meta.emoji}</span>
                  <span className="text-[14px] font-semibold text-ink">{meta.chip}</span>
                </button>
              ))}
            </div>
            {editor.draft.phase !== 'maintain' && (
              <>
                <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
                  Rate
                </p>
                <div className="flex gap-1.5">
                  {RATE_OPTIONS[editor.draft.phase].map((r) => (
                    <button
                      key={r}
                      onClick={() => setEditor({ ...editor, draft: { ...editor.draft, weeklyRateLb: r } })}
                      className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold ${
                        editor.draft.weeklyRateLb === r
                          ? 'bg-series-1 text-white'
                          : 'bg-surface-3 text-ink-2'
                      }`}
                    >
                      {r > 0 ? '+' : ''}
                      {r} lb/wk
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
                  Goal weight
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      setEditor({ ...editor, draft: { ...editor.draft, goalWeight: editor.draft.goalWeight - 1 } })
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-[17px] text-ink-2"
                  >
                    −
                  </button>
                  <span className="w-24 text-center text-[22px] font-bold text-ink">
                    {editor.draft.goalWeight}{' '}
                    <span className="text-[12px] font-normal text-ink-3">lb</span>
                  </span>
                  <button
                    onClick={() =>
                      setEditor({ ...editor, draft: { ...editor.draft, goalWeight: editor.draft.goalWeight + 1 } })
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-[17px] text-ink-2"
                  >
                    +
                  </button>
                </div>
              </>
            )}
            <button
              onClick={saveGoal}
              className="mt-5 w-full rounded-xl bg-series-1 py-3 text-[14px] font-semibold text-white"
            >
              {editor.isNew ? 'Start new goal' : 'Save changes'}
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}
