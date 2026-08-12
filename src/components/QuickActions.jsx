// The "+" launcher: a grid of everything you can log or start from anywhere
// in the app. MacroFactor-style hub, Arrow-style playfulness.

import Sheet from './Sheet'

const ACTIONS = [
  { id: 'search', emoji: '🔍', label: 'Search food' },
  { id: 'barcode', emoji: '𝄃𝄂𝄀', label: 'Scan barcode' },
  { id: 'photo', emoji: '📸', label: 'Capture meal' },
  { id: 'describe', emoji: '✨', label: 'Describe food' },
  { id: 'templates', emoji: '🍽️', label: 'Meal templates' },
  { id: 'activity', emoji: '🏃', label: 'Log activity' },
  { id: 'workout', emoji: '🏋️', label: 'Start workout' },
  { id: 'weighin', emoji: '⚖️', label: 'Log weigh-in' },
]

export default function QuickActions({ open, onClose, onAction }) {
  return (
    <Sheet open={open} onClose={onClose} title="Quick add">
      <div className="grid grid-cols-4 gap-2.5">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-3 px-1 py-3.5 active:scale-95 transition-transform"
          >
            <span className="text-[22px] leading-none">{a.emoji}</span>
            <span className="text-center text-[10px] font-medium leading-tight text-ink-2">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
