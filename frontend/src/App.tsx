import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { PermintaanPerbaikan } from './pages/PermintaanPerbaikan'
import { Assets } from './pages/Assets'
import { Inventory } from './pages/Inventory'
import { PreventiveMaintenance } from './pages/PreventiveMaintenance'
import { TrackingPO } from './pages/TrackingPO'
import { AssetHistoryPublic } from './pages/AssetHistoryPublic'
import { Login } from './pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/asset-history/:assetId" element={<AssetHistoryPublic />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/work-orders" element={<Navigate to="/permintaan-perbaikan" replace />} />
          <Route path="/permintaan-perbaikan" element={<PermintaanPerbaikan />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/preventive-maintenance" element={<PreventiveMaintenance />} />
          <Route path="/tracking-po" element={<TrackingPO />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
