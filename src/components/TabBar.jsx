const TABS = [
  {
    id: 'today',
    label: 'Today',
    icon: (
      <path d="M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: (
      <path
        d="M12 3c-4 3.5-6.5 6.7-6.5 10A6.5 6.5 0 0 0 12 19.5 6.5 6.5 0 0 0 18.5 13c0-3.3-2.5-6.5-6.5-10Z M12 19.5V21"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  { id: 'train', label: 'Train', center: true },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <path d="M4 20V14M10 20V9M16 20v-4M22 20V5" strokeWidth="1.8" strokeLinecap="round" transform="translate(-1 0)" />
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <path
        d="M12 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM5 20.2c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="relative z-30 flex items-end justify-around border-t border-hairline bg-page/95 px-2 pb-5 pt-2 backdrop-blur">
      {TABS.map((tab) =>
        tab.center ? (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-series-1 text-white shadow-lg shadow-series-1/30 active:scale-95 transition-transform"
            aria-label="Train"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M6.5 8.5v7M4 10v4M17.5 8.5v7M20 10v4M6.5 12h11"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex w-14 flex-col items-center gap-0.5 pt-1 text-[10px] font-medium transition-colors ${
              active === tab.id ? 'text-ink' : 'text-ink-3'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {tab.icon}
            </svg>
            {tab.label}
          </button>
        ),
      )}
    </nav>
  )
}
