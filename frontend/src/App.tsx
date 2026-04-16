import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { PermintaanPerbaikan } from './pages/PermintaanPerbaikan'
import { Assets } from './pages/Assets'
import { Inventory } from './pages/Inventory'
import { PreventiveMaintenance } from './pages/PreventiveMaintenance'
import { TrackingPO } from './pages/TrackingPO'
import { AssetHistoryPublic } from './pages/AssetHistoryPublic'
import { Login } from './pages/Login'
import { clearSessionUser, getSessionUser } from './auth'

function App() {
  const [sessionUser, setSessionUser] = useState(() => getSessionUser())

  const handleLogout = () => {
    clearSessionUser()
    setSessionUser(null)
  }

  if (!sessionUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => setSessionUser(getSessionUser())} />} />
        <Route path="/asset-history/:assetId" element={<AssetHistoryPublic />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout sessionUser={sessionUser} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/work-orders" element={<Navigate to="/permintaan-perbaikan" replace />} />
        <Route path="/permintaan-perbaikan" element={<PermintaanPerbaikan />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/preventive-maintenance" element={<PreventiveMaintenance />} />
        <Route path="/tracking-po" element={<TrackingPO />} />
        <Route path="/asset-history/:assetId" element={<AssetHistoryPublic />} />
      </Routes>
    </Layout>
  )
}

export default App
