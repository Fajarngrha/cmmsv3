import { useEffect, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiUrl } from '../api'
import { AddSparePartModal } from '../components/AddSparePartModal'
import { IssueSparePartModal } from '../components/IssueSparePartModal'
import { exportToCsv, parseCsvToObjects, type CsvColumn } from '../utils/exportToCsv'

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
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null)
  const [receivePartId, setReceivePartId] = useState<string | null>(null)
  const [receiveQty, setReceiveQty] = useState('')
  const actionMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpenId(null)
        setReceivePartId(null)
        setReceiveQty('')
      }
    }
    if (actionMenuOpenId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [actionMenuOpenId])

  const categories = [...new Set(parts.map((p) => p.category))].sort()

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportMessage(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage({ type: 'err', text: 'Pilih file CSV (.csv).' })
      return
    }
    setImporting(true)
    const reader = new FileReader()
    reader.onload = () => {
      const text = (reader.result as string) || ''
      try {
        const rows = parseCsvToObjects(text)
        const payload = rows
          .filter((r) => (r['Nama'] ?? r['name'] ?? '').trim() && (r['Category'] ?? r['category'] ?? '').trim())
          .map((r) => ({
            partCode: (r['Part Code'] ?? r['partCode'] ?? '').trim() || undefined,
            name: (r['Nama'] ?? r['name'] ?? '').trim(),
            spec: (r['Spesifikasi'] ?? r['spec'] ?? '').trim() || undefined,
            forMachine: (r['Untuk Mesin'] ?? r['forMachine'] ?? '').trim() || undefined,
            category: (r['Category'] ?? r['category'] ?? '').trim(),
            stock: Number(r['Stock'] ?? r['stock']) || 0,
            minStock: Number(r['Min Stock'] ?? r['minStock']) || 0,
            unit: (r['Unit'] ?? r['unit'] ?? 'pcs').trim() || 'pcs',
            location: (r['Location'] ?? r['location'] ?? '').trim() || undefined,
          }))
        if (payload.length === 0) {
          setImporting(false)
          setImportMessage({ type: 'err', text: 'Tidak ada baris valid (Nama dan Category wajib).' })
          return
        }
        fetch(apiUrl('/api/inventory/spare-parts/import'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parts: payload }),
        })
          .then((res) => res.json())
          .then((data) => {
            load()
            loadHistory()
            const msg = data.skipped
              ? `${data.imported ?? 0} spare part diimpor, ${data.skipped} dilewati (Part Code duplikat).`
              : `${data.imported ?? 0} spare part berhasil diimpor.`
            setImportMessage({ type: 'ok', text: msg })
          })
          .catch(() => setImportMessage({ type: 'err', text: 'Gagal mengimpor. Periksa koneksi atau format data.' }))
          .finally(() => setImporting(false))
      } catch {
        setImporting(false)
        setImportMessage({ type: 'err', text: 'Format CSV tidak valid.' })
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

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

  const handleReceiveSubmit = (partId: string) => {
    const qty = Number(receiveQty)
    if (!Number.isInteger(qty) || qty <= 0) {
      return
    }
    fetch(apiUrl(`/api/inventory/spare-parts/${partId}/receive`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty }),
    })
      .then((r) => {
        if (r.ok) {
          load()
          loadHistory()
          setActionMenuOpenId(null)
          setReceivePartId(null)
          setReceiveQty('')
        }
      })
      .catch(() => {})
  }

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Spare Parts Inventory</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Monitor stock levels to avoid delays in permintaan perbaikan
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const columns: CsvColumn<SparePart>[] = [
              { header: 'Part Code', key: 'partCode' },
              { header: 'Nama', key: 'name' },
              { header: 'Spesifikasi', getValue: (p) => p.spec ?? '—' },
              { header: 'Untuk Mesin', getValue: (p) => p.forMachine ?? '—' },
              { header: 'Category', key: 'category' },
              { header: 'Stock', key: 'stock' },
              { header: 'Min Stock', key: 'minStock' },
              { header: 'Unit', key: 'unit' },
              { header: 'Location', key: 'location' },
              { header: 'Status', getValue: (p) => (p.stock <= p.minStock ? 'Low Stock' : 'OK') },
            ]
            exportToCsv(filtered, columns, `inventory-spare-parts-${new Date().toISOString().slice(0, 10)}.csv`)
          }}
        >
          Export to CSV
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          {importing ? 'Mengimpor...' : 'Import data'}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
          + Tambah Spare Part
        </button>
      </div>
      {importMessage && (
        <p
          style={{
            margin: '-0.5rem 0 1rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            fontSize: '0.9rem',
            background: importMessage.type === 'ok' ? '#dcfce7' : '#fee2e2',
            color: importMessage.type === 'ok' ? '#166534' : '#991b1b',
          }}
        >
          {importMessage.text}
        </p>
      )}

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
                    <td style={{ padding: '0.75rem', position: 'relative' }}>
                      <div ref={actionMenuOpenId === p.id ? actionMenuRef : undefined} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem' }}
                          onClick={() => {
                            if (actionMenuOpenId === p.id) {
                              setActionMenuOpenId(null)
                              setReceivePartId(null)
                              setReceiveQty('')
                            } else {
                              setActionMenuOpenId(p.id)
                              setReceivePartId(null)
                              setReceiveQty('')
                            }
                          }}
                          title="Aksi"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        {actionMenuOpenId === p.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: 4,
                              minWidth: 160,
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              zIndex: 50,
                              padding: receivePartId === p.id ? '0.75rem' : '0.5rem',
                            }}
                          >
                            {receivePartId === p.id ? (
                              <>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4, fontWeight: 500 }}>Qty masuk</label>
                                <input
                                  type="number"
                                  min={1}
                                  className="input"
                                  value={receiveQty}
                                  onChange={(e) => setReceiveQty(e.target.value)}
                                  placeholder="Jumlah"
                                  style={{ width: '100%', marginBottom: 8 }}
                                />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                                    onClick={() => handleReceiveSubmit(p.id)}
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                                    onClick={() => { setReceivePartId(null); setReceiveQty('') }}
                                  >
                                    Batal
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                  onClick={() => { setActionMenuOpenId(null); setIssuePart(p) }}
                                  disabled={p.stock <= 0}
                                >
                                  Keluar
                                </button>
                                <button
                                  type="button"
                                  style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                  onClick={() => setReceivePartId(p.id)}
                                >
                                  Masuk
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
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
