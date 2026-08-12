// Whoop-style 270° arc gauge with rounded caps.

export default function ArcGauge({ value, color, size = 150, stroke = 13, children }) {
  const r = (size - stroke) / 2
  const cx = size / 2
  const polar = (deg) => [
    cx + r * Math.cos((deg * Math.PI) / 180),
    cx + r * Math.sin((deg * Math.PI) / 180),
  ]
  const arc = (from, to) => {
    const [x1, y1] = polar(from)
    const [x2, y2] = polar(to)
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
  }
  const v = Math.max(0, Math.min(100, value))
  const end = 135 + (v / 100) * 270
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <path d={arc(135, 405)} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} strokeLinecap="round" />
        {v > 1 && (
          <path d={arc(135, end)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
