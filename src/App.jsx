import { useState } from 'react'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './components/ui'
import PhoneFrame from './components/PhoneFrame'
import TabBar from './components/TabBar'
import Today from './screens/Today'
import Nutrition from './screens/Nutrition'
import Train from './screens/Train'
import Stats from './screens/Stats'
import Profile from './screens/Profile'

export default function App() {
  const [tab, setTab] = useState('today')
  return (
    <StoreProvider>
      <PhoneFrame>
        <ToastProvider>
          {/* Sheets/toasts position against the phone frame, so main stays non-positioned */}
          <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
            {tab === 'today' && <Today onNavigate={setTab} />}
            {tab === 'nutrition' && <Nutrition />}
            {tab === 'train' && <Train />}
            {tab === 'stats' && <Stats />}
            {tab === 'profile' && <Profile />}
          </main>
          <TabBar active={tab} onChange={setTab} />
        </ToastProvider>
      </PhoneFrame>
    </StoreProvider>
  )
}
