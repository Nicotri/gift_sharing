import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Spinner } from './components/UI'
import './styles/global.css'

// Pages
import Onboarding from './pages/Onboarding'
import Home       from './pages/Home'
import Group      from './pages/Group'
import Wishlist   from './pages/Wishlist'
import GiftDetail from './pages/GiftDetail'
import JoinGroup  from './pages/JoinGroup'

function AuthGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <Spinner size={36} />
    </div>
  )

  // Allow unauthenticated users through to join links so they can onboard first
  if (!user) return <Navigate to="/onboarding" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <Spinner size={36} />
    </div>
  )

  return (
    <div className="app-shell">
      <Routes>
        {/* Public */}
        <Route
          path="/onboarding"
          element={user ? <Navigate to="/" replace /> : <Onboarding />}
        />
        <Route
          path="/join/:code"
          element={user ? <JoinGroup /> : <Navigate to="/onboarding" replace />}
        />

        {/* Protected */}
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/group/:groupId" element={<AuthGuard><Group /></AuthGuard>} />
        <Route path="/group/:groupId/wishlist/:ownerId" element={<AuthGuard><Wishlist /></AuthGuard>} />
        <Route path="/group/:groupId/wishlist/:ownerId/gift/:giftId" element={<AuthGuard><GiftDetail /></AuthGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
