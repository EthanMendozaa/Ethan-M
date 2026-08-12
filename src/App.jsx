import { useState } from 'react'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './components/ui'
import PhoneFrame from './components/PhoneFrame'
import TabBar from './components/TabBar'
import QuickActions from './components/QuickActions'
import FoodFlows from './components/FoodFlows'
import Today from './screens/Today'
import Nutrition from './screens/Nutrition'
import Train from './screens/Train'
import Stats from './screens/Stats'
import Profile from './screens/Profile'
import WeightDetail from './screens/WeightDetail'

export default function App() {
  const [tab, setTab] = useState('today')
  const [weightOpen, setWeightOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [foodView, setFoodView] = useState(null) // search | describe | barcode | photo | templates | activity
  const [pendingWorkout, setPendingWorkout] = useState(false)

  const openWeight = () => setWeightOpen(true)
  const openFood = (view = 'search') => setFoodView(view)

  function handleQuickAction(id) {
    setQuickOpen(false)
    if (id === 'workout') {
      setTab('train')
      setPendingWorkout(true)
    } else if (id === 'weighin') {
      setWeightOpen(true)
    } else {
      setFoodView(id)
    }
  }

  return (
    <StoreProvider>
      <PhoneFrame>
        <ToastProvider>
          {/* Sheets/toasts position against the phone frame, so main stays non-positioned */}
          <main className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
            {tab === 'today' && (
              <Today onNavigate={setTab} onOpenWeight={openWeight} />
            )}
            {tab === 'nutrition' && (
              <Nutrition onOpenWeight={openWeight} onAddFood={openFood} />
            )}
            {tab === 'train' && (
              <Train autoStart={pendingWorkout} onAutoStarted={() => setPendingWorkout(false)} />
            )}
            {tab === 'stats' && <Stats />}
            {tab === 'profile' && <Profile onNavigate={setTab} />}
          </main>
          <TabBar active={tab} onChange={setTab} onPlus={() => setQuickOpen(true)} />
          {weightOpen && <WeightDetail onClose={() => setWeightOpen(false)} />}
          <QuickActions
            open={quickOpen}
            onClose={() => setQuickOpen(false)}
            onAction={handleQuickAction}
          />
          <FoodFlows view={foodView} onClose={() => setFoodView(null)} />
        </ToastProvider>
      </PhoneFrame>
    </StoreProvider>
  )
}
