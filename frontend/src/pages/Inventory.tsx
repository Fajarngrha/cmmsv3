import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiUrl } from '../api'
import { AddSparePartModal } from '../components/AddSparePartModal'
import { IssueSparePartModal } from '../components/IssueSparePartModal'

interface SparePart {
  id: string
  partCode: string
  name: string
  category: string
  stock: number
  minStock: number
  unit: string
  location: string
  spec?: string
  forMachine?: string
}

interface SparePartMovement {
  id: string
  partId: string
  partCode: string
  partName: string
  type: 'in' | 'out'
  qty: number
  unit: string
  reason?: string
  pic?: string
  createdAt: string
}

export function Inventory() {
  const [parts, setParts] = useState<SparePart[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [issuePart, setIssuePart] = useState<SparePart | null>(null)
  const [history, setHistory] = useState<SparePartMovement[]>([])
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'in' | 'out'>('all')

  const load = () => {
    fetch(apiUrl('/api/inventory/spare-parts'))
      .then((r) => r.json())
      .then((data) => {
        setParts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const loadHistory = () => {
    const q = historyTypeFilter === 'all' ? '' : `?type=${historyTypeFilter}`
    fetch(apiUrl(`/api/inventory/spare-parts/history${q}`))
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    loadHistory()
  }, [historyTypeFilter])

  const categories = [...new Set(parts.map((p) => p.category))].sort()

  const filtered = parts.filter((p) => {
    const matchSearch =
      p.partCode.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const chartData = categories.map((cat) => {
    const items = parts.filter((p) => p.category === cat)
    const totalStock = items.reduce((s, p) => s + p.stock, 0)
    const lowStock = items.filter((p) => p.stock <= p.minStock).length
    return { category: cat, stock: totalStock, lowStock, count: items.length }
  })

  const lowStockCount = parts.filter((p) => p.stock <= p.minStock).length

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Spare Parts Inventory</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Monitor stock levels to avoid delays in work orders
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Part Types</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{parts.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Low Stock Items</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lowStockCount}</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
          + Tambah Spare Part
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Stock by Category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="stock" name="Total Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="search"
          className="input"
          placeholder="Cari part code atau nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Part Code</th>
                <th style={{ padding: '0.75rem' }}>Nama</th>
                <th style={{ padding: '0.75rem' }}>Spesifikasi</th>
                <th style={{ padding: '0.75rem' }}>Untuk Mesin</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Stock</th>
                <th style={{ padding: '0.75rem' }}>Min Stock</th>
                <th style={{ padding: '0.75rem' }}>Unit</th>
                <th style={{ padding: '0.75rem' }}>Location</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', minWidth: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock <= p.minStock
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 500 }}>{p.partCode}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem' }}>{p.spec || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{p.forMachine || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{p.category}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{p.stock}</td>
                    <td style={{ padding: '0.75rem' }}>{p.minStock}</td>
                    <td style={{ padding: '0.75rem' }}>{p.unit}</td>
                    <td style={{ padding: '0.75rem' }}>{p.location}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {isLow ? (
                        <span className="badge badge-open">Low Stock</span>
                      ) : (
                        <span className="badge badge-completed">OK</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => setIssuePart(p)}
                        disabled={p.stock <= 0}
                        title={p.stock <= 0 ? 'Stock habis' : 'Keluar spare part'}
                      >
                        Keluar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            Menampilkan {filtered.length} dari {parts.length} spare parts
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>History Spare Part Masuk & Keluar</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Rekapan transaksi untuk keperluan audit
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <select
            className="select"
            value={historyTypeFilter}
            onChange={(e) => setHistoryTypeFilter(e.target.value as 'all' | 'in' | 'out')}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="all">Semua</option>
            <option value="in">Masuk</option>
            <option value="out">Keluar</option>
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Tanggal</th>
              <th style={{ padding: '0.75rem' }}>Part Code</th>
              <th style={{ padding: '0.75rem' }}>Nama</th>
              <th style={{ padding: '0.75rem' }}>Tipe</th>
              <th style={{ padding: '0.75rem' }}>Qty</th>
              <th style={{ padding: '0.75rem' }}>Unit</th>
              <th style={{ padding: '0.75rem' }}>PIC</th>
              <th style={{ padding: '0.75rem' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                  Belum ada riwayat transaksi spare part.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(h.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{h.partCode}</td>
                  <td style={{ padding: '0.75rem' }}>{h.partName}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: h.type === 'in' ? '#dcfce7' : '#fee2e2',
                        color: h.type === 'in' ? '#166534' : '#991b1b',
                      }}
                    >
                      {h.type === 'in' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{h.qty}</td>
                  <td style={{ padding: '0.75rem' }}>{h.unit}</td>
                  <td style={{ padding: '0.75rem' }}>{h.pic || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{h.reason || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addModalOpen && (
        <AddSparePartModal
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false)
            load()
            loadHistory()
          }}
        />
      )}
      {issuePart && (
        <IssueSparePartModal
          part={issuePart}
          onClose={() => setIssuePart(null)}
          onSuccess={() => {
            setIssuePart(null)
            load()
            loadHistory()
          }}
        />
      )}
    </div>
  )
}
