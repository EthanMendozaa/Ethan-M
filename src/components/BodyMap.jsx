// Anatomically correct front/back muscle map. Path data adapted from
// react-native-body-highlighter (MIT © ELABBASSI Hicham) — see
// src/lib/bodyPaths.js. Tracked muscle groups fill with the caller's color;
// everything else stays in the base silhouette tone.

import { BODY_FRONT, BODY_BACK, FRONT_VIEWBOX, BACK_VIEWBOX } from '../lib/bodyPaths'

const BASE_FILL = '#2b2b2e'

function Figure({ parts, viewBox, colorFor, selected, onSelect, label }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={viewBox} className="w-full max-w-[150px]">
        {parts.map((part, pi) => {
          const tracked = part.muscle != null
          const isSel = tracked && selected === part.muscle
          const fill = tracked ? colorFor(part.muscle) : BASE_FILL
          return (
            <g
              key={`${part.slug}-${pi}`}
              onClick={tracked ? () => onSelect(part.muscle) : undefined}
              style={tracked ? { cursor: 'pointer' } : undefined}
            >
              {part.paths.map((d, di) => (
                <path
                  key={di}
                  d={d}
                  fill={fill}
                  stroke={isSel ? 'rgba(255,255,255,0.9)' : 'none'}
                  strokeWidth={isSel ? 3 : 0}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-3">
        {label}
      </span>
    </div>
  )
}

export default function BodyMap({ colorFor, selected, onSelect }) {
  return (
    <div className="flex justify-center gap-4">
      <Figure
        parts={BODY_FRONT}
        viewBox={FRONT_VIEWBOX}
        colorFor={colorFor}
        selected={selected}
        onSelect={onSelect}
        label="Front"
      />
      <Figure
        parts={BODY_BACK}
        viewBox={BACK_VIEWBOX}
        colorFor={colorFor}
        selected={selected}
        onSelect={onSelect}
        label="Back"
      />
    </div>
  )
}
