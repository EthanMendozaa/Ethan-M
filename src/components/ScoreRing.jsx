// SVG progress ring for the four daily scores. Unfilled track is a darker
// step of the surface so state reads across the whole ring.

export default function ScoreRing({ value, color, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, value)) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-surface-3)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
      />
    </svg>
  )
}
