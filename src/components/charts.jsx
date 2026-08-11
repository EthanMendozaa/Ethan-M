// Shared recharts config so every chart follows the same specs:
// 2px lines, hairline solid gridlines, recessive muted axes, dark tooltip.

export const AXIS = {
  stroke: 'var(--color-baseline)',
  tick: { fill: 'var(--color-ink-3)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
}

export const GRID = {
  stroke: 'var(--color-hairline)',
  strokeWidth: 1,
  vertical: false,
}

export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-surface-3 px-3 py-2 text-[12px] shadow-lg shadow-black/40">
      {label != null && <div className="mb-1 font-medium text-ink-3">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.stroke }} />
          <span className="text-ink-2">{p.name}:</span>
          <span className="font-semibold">{formatter ? formatter(p.value, p.dataKey) : p.value}</span>
        </div>
      ))}
    </div>
  )
}
