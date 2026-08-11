// Anatomical front/back muscle map, hand-drawn as bezier line-art in the
// style of Arrow's body diagram: a dark base silhouette with per-muscle
// regions that fill with whatever color the caller assigns, plus subtle
// striation detail strokes. Bilateral shapes are authored as the LEFT side
// and mirrored across x=100.

const BASE_FILL = '#232326'
const OUTLINE = 'rgba(255,255,255,0.07)'
const DETAIL = 'rgba(255,255,255,0.10)'

// Shared body silhouette (half, closed along the x=100 midline).
const BODY_HALF = `
M100 6 C 91 6, 85 13, 85 24 C 85 32, 87 38, 91 43
L 91 50 C 83 53, 71 56, 63 60
C 51 65, 46 73, 45 83
C 43 97, 41 111, 39 125
C 37 139, 35 152, 35 164
C 34 174, 33 184, 34 192
C 31 198, 30 206, 32 212
L 40 213 C 43 207, 44 199, 45 192
C 47 180, 49 168, 51 156
C 53 143, 56 129, 59 117
L 62 106
C 64 121, 66 137, 67 151
C 67 161, 65 171, 63 183
C 61 197, 62 211, 64 225
C 66 243, 69 259, 73 273
C 75 283, 75 291, 75 299
C 75 313, 77 327, 79 339
C 80 349, 81 357, 81 363
L 75 372 C 75 376, 79 378, 85 378 L 93 378 C 95 374, 95 368, 94 362
C 94 352, 95 342, 96 332
C 97 320, 98 308, 98 298
C 98 288, 97 280, 97 272
C 98 258, 99 242, 100 228
L 100 206 L 100 6 Z`

const FRONT_MUSCLES = [
  {
    muscle: 'Shoulders',
    d: 'M 47 82 C 45 72, 50 64, 62 60 C 71 58, 77 61, 78 67 C 78 73, 75 78, 70 81 C 62 86, 51 88, 47 82 Z',
  },
  {
    muscle: 'Chest',
    d: 'M 100 61 C 86 59, 73 61, 67 67 C 62 75, 64 85, 71 91 C 80 98, 92 99, 100 93 Z',
    details: ['M 69 68 C 80 64, 92 63, 100 64'],
  },
  {
    muscle: 'Biceps',
    d: 'M 58 93 C 64 93, 67 99, 67 109 C 67 119, 64 127, 59 131 C 54 133, 50 129, 49 121 C 49 109, 52 97, 58 93 Z',
    details: ['M 53 100 C 51 108, 51 118, 53 126'],
  },
  {
    muscle: 'Abs',
    d: 'M 90 99 L 100 99 L 100 151 C 96 153, 92 152, 90 147 C 88 129, 88 113, 90 99 Z',
    details: [
      'M 90 112 L 100 112',
      'M 90 125 L 100 125',
      'M 89 138 L 100 138',
    ],
  },
  {
    muscle: 'Abs',
    key: 'obliques',
    d: 'M 68 106 C 74 106, 81 110, 87 114 L 87 146 C 80 143, 73 136, 69 127 C 67 119, 66 111, 68 106 Z',
  },
  {
    muscle: 'Quads',
    d: 'M 65 188 C 75 179, 89 177, 96 184 C 99 198, 99 218, 97 236 C 96 250, 92 260, 87 268 C 80 273, 72 268, 69 257 C 64 237, 63 211, 65 188 Z',
    details: [
      'M 81 182 C 84 202, 85 226, 83 248',
      'M 92 236 C 94 246, 92 258, 88 264',
    ],
  },
  {
    muscle: 'Calves',
    key: 'calf-front',
    d: 'M 78 301 C 84 295, 93 295, 96 301 C 98 315, 97 331, 94 345 C 91 353, 83 353, 80 345 C 76 331, 76 315, 78 301 Z',
    details: ['M 87 300 C 88 316, 88 334, 87 348'],
  },
]

const BACK_MUSCLES = [
  {
    muscle: 'Back',
    key: 'traps',
    d: 'M 100 40 C 89 47, 78 55, 70 61 C 79 67, 87 79, 91 90 C 95 100, 98 108, 100 112 Z',
  },
  {
    muscle: 'Shoulders',
    d: 'M 47 82 C 45 72, 50 64, 62 60 C 71 58, 77 61, 78 67 C 78 73, 75 78, 70 81 C 62 86, 51 88, 47 82 Z',
  },
  {
    muscle: 'Back',
    key: 'lats',
    d: 'M 67 76 C 75 84, 85 89, 95 91 L 100 93 L 100 134 C 92 142, 81 135, 75 122 C 69 108, 66 90, 67 76 Z',
    details: ['M 74 92 C 79 104, 85 116, 92 126'],
  },
  {
    muscle: 'Back',
    key: 'erectors',
    d: 'M 93 134 L 100 136 L 100 172 C 96 173, 93 170, 92 164 C 91 154, 92 143, 93 134 Z',
  },
  {
    muscle: 'Triceps',
    d: 'M 58 93 C 64 93, 67 99, 67 109 C 67 119, 64 127, 59 131 C 54 133, 50 129, 49 121 C 49 109, 52 97, 58 93 Z',
    details: ['M 58 98 C 61 106, 61 118, 58 126', 'M 53 102 C 52 112, 53 120, 55 127'],
  },
  {
    muscle: 'Glutes',
    d: 'M 100 174 C 89 169, 76 171, 69 181 C 64 191, 65 203, 73 211 C 85 217, 97 213, 100 202 Z',
  },
  {
    muscle: 'Hamstrings',
    d: 'M 69 219 C 79 213, 93 213, 97 221 C 98 237, 96 253, 92 267 C 86 275, 74 273, 70 263 C 66 247, 67 233, 69 219 Z',
    details: ['M 83 216 C 84 232, 84 252, 82 268'],
  },
  {
    muscle: 'Calves',
    d: 'M 77 293 C 83 287, 93 287, 96 293 C 99 307, 98 323, 94 339 C 90 349, 81 349, 78 339 C 74 323, 74 307, 77 293 Z',
    details: ['M 87 292 C 88 306, 88 322, 87 336', 'M 80 300 C 78 312, 79 326, 82 338'],
  },
]

function Figure({ muscles, colorFor, selected, onSelect, label }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 380" className="w-full max-w-[160px]">
        {[null, 'mirror'].map((side) => (
          <g key={side ?? 'left'} transform={side ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d={BODY_HALF} fill={BASE_FILL} stroke={OUTLINE} strokeWidth="1.5" />
          </g>
        ))}
        {muscles.map((m, mi) =>
          [null, 'mirror'].map((side) => {
            const isSel = selected === m.muscle
            return (
              <g
                key={`${m.key ?? m.muscle}-${mi}-${side ?? 'left'}`}
                transform={side ? 'translate(200 0) scale(-1 1)' : undefined}
                onClick={() => onSelect(m.muscle)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={m.d}
                  fill={colorFor(m.muscle)}
                  fillOpacity="0.92"
                  stroke={isSel ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.35)'}
                  strokeWidth={isSel ? 1.6 : 1}
                />
                {m.details?.map((d, di) => (
                  <path key={di} d={d} fill="none" stroke={DETAIL} strokeWidth="1" />
                ))}
              </g>
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
    <div className="flex justify-center gap-4">
      <Figure muscles={FRONT_MUSCLES} colorFor={colorFor} selected={selected} onSelect={onSelect} label="Front" />
      <Figure muscles={BACK_MUSCLES} colorFor={colorFor} selected={selected} onSelect={onSelect} label="Back" />
    </div>
  )
}
