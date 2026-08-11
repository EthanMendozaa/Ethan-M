// ~390px phone frame centered on desktop, with a cosmetic status bar.

export default function PhoneFrame({ children }) {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="flex min-h-screen items-center justify-center bg-page sm:py-6">
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-page sm:h-[844px] sm:w-[390px] sm:rounded-[48px] sm:border-8 sm:border-black sm:shadow-2xl sm:shadow-black/60 sm:ring-1 sm:ring-white/10">
        <div className="relative z-30 flex items-center justify-between px-7 pb-1 pt-3 text-[13px] font-semibold text-ink">
          <span>{time.replace(/\s?[AP]M/, '')}</span>
          <div className="absolute left-1/2 top-2 hidden h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:block" />
          <span className="flex items-center gap-1.5">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4" rx="0.8" opacity="0.5" />
              <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.8" opacity="0.75" />
              <rect x="9" y="2" width="3" height="9" rx="0.8" />
            </svg>
            <svg width="22" height="11" viewBox="0 0 24 12" fill="none">
              <rect x="0.5" y="0.5" width="19" height="11" rx="3" stroke="currentColor" opacity="0.4" />
              <rect x="2" y="2" width="13" height="8" rx="1.6" fill="currentColor" />
              <rect x="21" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.4" />
            </svg>
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
