import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { WorkOrders } from './pages/WorkOrders'
import { Assets } from './pages/Assets'
import { Inventory } from './pages/Inventory'
import { PreventiveMaintenance } from './pages/PreventiveMaintenance'
import { TrackingPO } from './pages/TrackingPO'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/preventive-maintenance" element={<PreventiveMaintenance />} />
        <Route path="/tracking-po" element={<TrackingPO />} />
      </Routes>
    </Layout>
  )
}

export default App
