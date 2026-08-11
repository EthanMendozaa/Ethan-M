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
import WeightDetail from './screens/WeightDetail'

export default function App() {
  const [tab, setTab] = useState('today')
  const [weightOpen, setWeightOpen] = useState(false)
  const openWeight = () => setWeightOpen(true)
  return (
    <StoreProvider>
      <PhoneFrame>
        <ToastProvider>
          {/* Sheets/toasts position against the phone frame, so main stays non-positioned */}
          <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
            {tab === 'today' && <Today onNavigate={setTab} onOpenWeight={openWeight} />}
            {tab === 'nutrition' && <Nutrition onOpenWeight={openWeight} />}
            {tab === 'train' && <Train />}
            {tab === 'stats' && <Stats />}
            {tab === 'profile' && <Profile />}
          </main>
          <TabBar active={tab} onChange={setTab} />
          {weightOpen && <WeightDetail onClose={() => setWeightOpen(false)} />}
        </ToastProvider>
      </PhoneFrame>
    </StoreProvider>
  )
}
