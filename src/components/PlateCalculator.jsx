// Interactive plate calculator: pick a bar, tap plates on/off, or auto-load
// to a target. Plates render on a side-view bar, color-coded by size.

import { useMemo, useState } from 'react'

const PLATES = [
  { lb: 45, color: '#3987e5', h: 64, w: 13 },
  { lb: 35, color: '#c98500', h: 56, w: 12 },
  { lb: 25, color: '#199e70', h: 48, w: 11 },
  { lb: 10, color: '#d55181', h: 38, w: 9 },
  { lb: 5, color: '#d95926', h: 30, w: 8 },
  { lb: 2.5, color: '#898781', h: 24, w: 7 },
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
    setSide((prev) =>
      [...prev, lb].sort((a, b) => b - a),
    )
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
      {/* Total + target delta */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">On the bar</p>
          <p className="text-[34px] font-bold leading-tight text-ink">
            {total}
            <span className="ml-1 text-[14px] font-medium text-ink-3">lb</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-ink-3">target {initialLoad} lb</p>
          <p
            className={`text-[13px] font-semibold ${
              delta === 0 ? 'text-good' : 'text-warning'
            }`}
          >
            {delta === 0 ? 'exact ✓' : `${delta > 0 ? '+' : ''}${delta} lb`}
          </p>
        </div>
      </div>

      {/* Bar visualization — one side, mirrored loading */}
      <div className="mt-4 flex h-24 items-center rounded-xl bg-surface-3/50 px-3">
        <div className="h-3 w-8 rounded-sm bg-ink-3/40" /> {/* collar */}
        <div className="flex items-center gap-[3px] pl-1">
          {side.map((lb, i) => {
            const meta = PLATES.find((p) => p.lb === lb)
            return (
              <button
                key={i}
                onClick={() => removePlate(i)}
                className="flex items-center justify-center rounded-[3px] text-[9px] font-bold text-white shadow-sm active:scale-95 transition-transform"
                style={{ height: meta.h, width: meta.w * 2, background: meta.color }}
                title="Tap to remove"
              >
                {lb}
              </button>
            )
          })}
        </div>
        <div className="h-2 flex-1 rounded-full bg-ink-3/40" /> {/* bar */}
        <span className="pl-2 text-[10px] font-semibold text-ink-3">{bar} lb bar</span>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-3">
        {side.length ? `${side.join(' + ')} per side · tap a plate to remove` : 'Empty bar — add plates below'}
      </p>

      {/* Plate tray */}
      <div className="mt-4 flex items-end justify-between gap-1.5">
        {PLATES.map((p) => (
          <button
            key={p.lb}
            onClick={() => addPlate(p.lb)}
            className="flex flex-1 flex-col items-center gap-1 active:scale-95 transition-transform"
          >
            <span
              className="flex w-full items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ height: p.h * 0.72, background: p.color }}
            >
              {p.lb}
            </span>
          </button>
        ))}
      </div>

      {/* Bar picker + actions */}
      <div className="mt-4 flex items-center justify-between">
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
