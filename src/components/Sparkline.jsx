// Tiny inline-SVG sparkline: history in the de-emphasis ink, latest point
// accented with a surface-ringed end dot.

export default function Sparkline({ data, width = 72, height = 24, color = 'var(--color-ink-3)', accent }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (width - pad * 2),
    pad + (1 - (v - min) / span) * (height - pad * 2),
  ])
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [ex, ey] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r="4" fill="var(--color-surface)" />
      <circle cx={ex} cy={ey} r="2.5" fill={accent ?? color} />
    </svg>
  )
}
