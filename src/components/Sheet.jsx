// Bottom sheet used for every "Why did this change?" explanation —
// transparency is a core product value in this mockup.

export default function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="animate-sheet relative z-10 max-h-[80%] w-full overflow-y-auto no-scrollbar rounded-t-3xl bg-surface-2 px-5 pb-8 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-3" />
        {title && <h3 className="mb-3 text-[17px] font-semibold text-ink">{title}</h3>}
        <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-surface-3 py-3 text-[14px] font-semibold text-ink"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
