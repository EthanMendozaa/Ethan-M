// Plate calculator in the Arrow style: big centered total, a rendered bar
// with gradient plate slabs (tap a plate to strip it), and a row of circular
// plate buttons to load more. Auto-load greedy-fills to the set's target.

import { useMemo, useState } from 'react'

const PLATES = [
  { lb: 45, from: '#4a95ef', to: '#1c5cab', h: 116, w: 26 },
  { lb: 35, from: '#e09a10', to: '#8a5c00', h: 102, w: 24 },
  { lb: 25, from: '#22b381', to: '#0e6b4a', h: 88, w: 22 },
  { lb: 10, from: '#e06393', to: '#a03059', h: 68, w: 18 },
  { lb: 5, from: '#e56b35', to: '#9c3a14', h: 54, w: 16 },
  { lb: 2.5, from: '#9b9a93', to: '#5c5b56', h: 42, w: 14 },
]

const BARS = [45, 35, 15]

function greedyLoad(target, bar) {
  const perSide = Math.max(0, (target - bar) / 2)
  const out = []
  let rem = perSide
  for (const p of PLATES) {
    while (rem >= p.lb - 0.01) {
      out.push(p.lb)
      rem -= p.lb
    }
  }
  return out
}

export default function PlateCalculator({ initialLoad = 135 }) {
  const [bar, setBar] = useState(45)
  const [side, setSide] = useState(() => greedyLoad(initialLoad, 45))

  const total = useMemo(() => bar + side.reduce((s, p) => s + p, 0) * 2, [bar, side])
  const delta = total - initialLoad

  function addPlate(lb) {
    setSide((prev) => [...prev, lb].sort((a, b) => b - a))
  }

  function removePlate(idx) {
    setSide((prev) => prev.filter((_, i) => i !== idx))
  }

  function switchBar(b) {
    setBar(b)
    setSide(greedyLoad(initialLoad, b))
  }

  return (
    <div>
      {/* Big centered total */}
      <div className="text-center">
        <p className="text-[36px] font-bold leading-tight text-ink">
          {total} <span className="text-[16px] font-medium text-ink-3">lbs</span>
        </p>
        <p className="text-[12px] text-ink-3">
          target {initialLoad} lb ·{' '}
          <span className={delta === 0 ? 'font-semibold text-good' : 'font-semibold text-warning'}>
            {delta === 0 ? 'exact ✓' : `${delta > 0 ? '+' : ''}${delta} lb`}
          </span>
        </p>
      </div>

      {/* Bar render — one loaded sleeve, mirrored weight */}
      <div className="mt-5 flex h-36 items-center overflow-x-auto no-scrollbar">
        {/* sleeve stub */}
        <div
          className="flex h-4 w-12 shrink-0 items-center justify-center rounded-l-md text-[10px] font-bold text-black/60"
          style={{ background: 'linear-gradient(180deg,#d7d7d2,#8f8f88)' }}
        >
          {bar}
        </div>
        {/* collar */}
        <div
          className="h-9 w-2.5 shrink-0 rounded-[3px]"
          style={{ background: 'linear-gradient(180deg,#c8c8c2,#7a7a74)' }}
        />
        {/* plates */}
        <div className="flex shrink-0 items-center gap-[3px] px-[3px]">
          {side.map((lb, i) => {
            const meta = PLATES.find((p) => p.lb === lb)
            return (
              <button
                key={i}
                onClick={() => removePlate(i)}
                className="flex items-center justify-center rounded-[7px] text-[12px] font-bold text-white shadow-lg shadow-black/40 active:scale-95 transition-transform"
                style={{
                  height: meta.h,
                  width: meta.w,
                  background: `linear-gradient(180deg, ${meta.from}, ${meta.to})`,
                  boxShadow: 'inset 2px 0 3px rgba(255,255,255,0.25), inset -2px 0 4px rgba(0,0,0,0.35), 0 6px 12px rgba(0,0,0,0.4)',
                }}
                title="Tap to remove"
              >
                {lb}
              </button>
            )
          })}
        </div>
        {/* bar shaft */}
        <div
          className="h-2.5 min-w-16 flex-1 rounded-r-md"
          style={{ background: 'linear-gradient(180deg,#d7d7d2,#8f8f88)' }}
        />
      </div>
      <p className="-mt-2 text-center text-[11px] text-ink-3">
        {side.length
          ? `${side.join(' + ')} per side · tap a plate to remove`
          : 'Empty bar — add plates below'}
      </p>

      {/* Add plates */}
      <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">Add plates</p>
      <div className="flex justify-between gap-1.5">
        {PLATES.map((p) => (
          <button
            key={p.lb}
            onClick={() => addPlate(p.lb)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-[13px] font-bold text-ink active:scale-90 transition-transform"
            style={{ boxShadow: `inset 0 0 0 2px ${p.to}` }}
          >
            {p.lb}
          </button>
        ))}
      </div>

      {/* Bar picker + actions */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex overflow-hidden rounded-lg bg-surface-3">
          {BARS.map((b) => (
            <button
              key={b}
              onClick={() => switchBar(b)}
              className={`px-3 py-1.5 text-[12px] font-medium ${
                bar === b ? 'bg-series-1 text-white' : 'text-ink-3'
              }`}
            >
              {b} bar
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSide([])}
            className="rounded-lg bg-surface-3 px-3 py-1.5 text-[12px] font-medium text-ink-2"
          >
            Clear
          </button>
          <button
            onClick={() => setSide(greedyLoad(initialLoad, bar))}
            className="rounded-lg bg-series-1 px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Auto-load
          </button>
        </div>
      </div>
    </div>
  )
}
