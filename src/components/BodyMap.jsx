// Stylized front/back muscle map. Each muscle group is a set of SVG shapes
// filled by whatever color the caller assigns (recovery status or weekly
// volume), with non-tracked areas in a muted base tone.

const BASE = 'var(--color-surface-3)'

// Shapes per view. el: [type, attrs]. Symmetric limbs listed explicitly.
const FRONT = [
  { muscle: null, els: [
    ['circle', { cx: 60, cy: 15, r: 10 }],
    ['rect', { x: 54, y: 25, width: 12, height: 7, rx: 3 }],
    ['path', { d: 'M40 33 L80 33 L76 96 L44 96 Z' }], // torso base
    ['rect', { x: 22, y: 80, width: 9, height: 27, rx: 4.5 }], // forearms
    ['rect', { x: 89, y: 80, width: 9, height: 27, rx: 4.5 }],
    ['circle', { cx: 26, cy: 112, r: 4 }], // hands
    ['circle', { cx: 94, cy: 112, r: 4 }],
    ['rect', { x: 44, y: 96, width: 32, height: 14, rx: 5 }], // pelvis
    ['rect', { x: 45, y: 163, width: 12, height: 40, rx: 6 }], // shins
    ['rect', { x: 63, y: 163, width: 12, height: 40, rx: 6 }],
    ['rect', { x: 44, y: 205, width: 14, height: 6, rx: 3 }], // feet
    ['rect', { x: 62, y: 205, width: 14, height: 6, rx: 3 }],
  ] },
  { muscle: 'Shoulders', els: [
    ['ellipse', { cx: 34, cy: 41, rx: 9, ry: 8 }],
    ['ellipse', { cx: 86, cy: 41, rx: 9, ry: 8 }],
  ] },
  { muscle: 'Chest', els: [
    ['path', { d: 'M43 36 Q59 34 59 42 L59 55 Q50 60 43 55 Z' }],
    ['path', { d: 'M77 36 Q61 34 61 42 L61 55 Q70 60 77 55 Z' }],
  ] },
  { muscle: 'Abs', els: [
    ['rect', { x: 50, y: 60, width: 20, height: 35, rx: 6 }],
    ['rect', { x: 44.5, y: 60, width: 4, height: 30, rx: 2 }],
    ['rect', { x: 71.5, y: 60, width: 4, height: 30, rx: 2 }],
  ] },
  { muscle: 'Biceps', els: [
    ['rect', { x: 23, y: 49, width: 11, height: 27, rx: 5.5 }],
    ['rect', { x: 86, y: 49, width: 11, height: 27, rx: 5.5 }],
  ] },
  { muscle: 'Quads', els: [
    ['rect', { x: 43, y: 111, width: 15, height: 48, rx: 7 }],
    ['rect', { x: 62, y: 111, width: 15, height: 48, rx: 7 }],
  ] },
]

const BACK = [
  { muscle: null, els: [
    ['circle', { cx: 60, cy: 15, r: 10 }],
    ['rect', { x: 54, y: 25, width: 12, height: 7, rx: 3 }],
    ['path', { d: 'M40 33 L80 33 L76 96 L44 96 Z' }],
    ['rect', { x: 22, y: 80, width: 9, height: 27, rx: 4.5 }],
    ['rect', { x: 89, y: 80, width: 9, height: 27, rx: 4.5 }],
    ['circle', { cx: 26, cy: 112, r: 4 }],
    ['circle', { cx: 94, cy: 112, r: 4 }],
    ['rect', { x: 52, y: 80, width: 16, height: 13, rx: 4 }], // lower back
    ['rect', { x: 44, y: 205, width: 14, height: 6, rx: 3 }],
    ['rect', { x: 62, y: 205, width: 14, height: 6, rx: 3 }],
  ] },
  { muscle: 'Back', els: [
    ['path', { d: 'M46 31 L74 31 L60 44 Z' }], // traps
    ['path', { d: 'M43 36 L77 36 L73 66 L60 80 L47 66 Z' }], // lats
  ] },
  { muscle: 'Shoulders', els: [
    ['ellipse', { cx: 34, cy: 41, rx: 9, ry: 8 }],
    ['ellipse', { cx: 86, cy: 41, rx: 9, ry: 8 }],
  ] },
  { muscle: 'Triceps', els: [
    ['rect', { x: 23, y: 49, width: 11, height: 27, rx: 5.5 }],
    ['rect', { x: 86, y: 49, width: 11, height: 27, rx: 5.5 }],
  ] },
  { muscle: 'Glutes', els: [
    ['ellipse', { cx: 51, cy: 101, rx: 10, ry: 9.5 }],
    ['ellipse', { cx: 69, cy: 101, rx: 10, ry: 9.5 }],
  ] },
  { muscle: 'Hamstrings', els: [
    ['rect', { x: 43, y: 114, width: 15, height: 45, rx: 7 }],
    ['rect', { x: 62, y: 114, width: 15, height: 45, rx: 7 }],
  ] },
  { muscle: 'Calves', els: [
    ['rect', { x: 44.5, y: 162, width: 13, height: 40, rx: 6.5 }],
    ['rect', { x: 62.5, y: 162, width: 13, height: 40, rx: 6.5 }],
  ] },
]

function Figure({ regions, colorFor, selected, onSelect, label }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 214" className="w-full max-w-[150px]">
        {regions.map((region, ri) =>
          region.els.map(([type, attrs], ei) => {
            const El = type
            const tracked = region.muscle != null
            const isSel = tracked && selected === region.muscle
            return (
              <El
                key={`${ri}-${ei}`}
                {...attrs}
                fill={tracked ? colorFor(region.muscle) : BASE}
                stroke={isSel ? 'var(--color-ink)' : 'var(--color-page)'}
                strokeWidth={isSel ? 1.6 : 1}
                onClick={tracked ? () => onSelect(region.muscle) : undefined}
                style={tracked ? { cursor: 'pointer' } : undefined}
              />
            )
          }),
        )}
      </svg>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-3">
        {label}
      </span>
    </div>
  )
}

export default function BodyMap({ colorFor, selected, onSelect }) {
  return (
    <div className="flex justify-center gap-6">
      <Figure regions={FRONT} colorFor={colorFor} selected={selected} onSelect={onSelect} label="Front" />
      <Figure regions={BACK} colorFor={colorFor} selected={selected} onSelect={onSelect} label="Back" />
    </div>
  )
}
