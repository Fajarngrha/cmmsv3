import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { CreatePOModal } from '../components/CreatePOModal'
import { HistoryPOModal } from '../components/HistoryPOModal'
import { ViewPOModal } from '../components/ViewPOModal'
import { exportToCsv, type CsvColumn } from '../utils/exportToCsv'
import { getPOStatusLabel, PO_STATUS_OPTIONS } from '../utils/poStatus'

interface PurchaseOrder {
  id: string
  tanggal: string
  itemDeskripsi: string
  model: string
  hargaPerUnit: number
  qty: number
  noRegistrasi: string
  noPO: string
  mesin: string
  noQuotation: string
  supplier: string
  kategori: string
  totalHarga: number
  status: string
}

function formatIdr(n: number) {
  return 'Rp. ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function TrackingPO() {
  const [list, setList] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewPoId, setViewPoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch(apiUrl('/api/purchase-orders'))
      .then((r) => r.json())
      .then((data) => {
        setList(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = list.filter((po) => {
    const matchSearch =
      !search.trim() ||
      po.tanggal.toLowerCase().includes(search.toLowerCase()) ||
      po.itemDeskripsi.toLowerCase().includes(search.toLowerCase()) ||
      (po.model ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (po.mesin ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (po.supplier ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || po.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Tracking PO</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Lacak proses order barang (Purchase Order)
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="search"
            className="input"
            placeholder="Cari Tanggal, Item, Model, Mesin, Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280, minWidth: 200 }}
          />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 200, flexShrink: 0 }}
            aria-label="Filter by status"
          >
          <option value="">Semua Status</option>
          {PO_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>
          History
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const columns: CsvColumn<PurchaseOrder>[] = [
              { header: 'Tanggal', key: 'tanggal' },
              { header: 'Item Deskripsi', key: 'itemDeskripsi' },
              { header: 'Model', getValue: (po) => po.model ?? '—' },
              { header: 'Harga/Unit', getValue: (po) => formatIdr(po.hargaPerUnit) },
              { header: 'Qty', key: 'qty' },
              { header: 'Mesin', getValue: (po) => po.mesin ?? '—' },
              { header: 'Supplier', getValue: (po) => po.supplier ?? '—' },
              { header: 'Status', getValue: (po) => getPOStatusLabel(po.status) },
            ]
            exportToCsv(filtered, columns, `tracking-po-${new Date().toISOString().slice(0, 10)}.csv`)
          }}
        >
          Export to CSV
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Tambah PO
        </button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Tanggal</th>
                <th style={{ padding: '0.75rem' }}>Item Deskripsi</th>
                <th style={{ padding: '0.75rem' }}>Model</th>
                <th style={{ padding: '0.75rem' }}>Harga/Unit</th>
                <th style={{ padding: '0.75rem' }}>Qty</th>
                <th style={{ padding: '0.75rem' }}>Mesin</th>
                <th style={{ padding: '0.75rem' }}>Supplier</th>
                <th style={{ padding: '0.75rem', minWidth: 180 }}>Status</th>
                <th style={{ padding: '0.75rem', minWidth: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>{po.tanggal}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 200 }} title={po.itemDeskripsi}>
                    {po.itemDeskripsi.length > 40 ? `${po.itemDeskripsi.slice(0, 40)}…` : po.itemDeskripsi || '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{po.model || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{formatIdr(po.hargaPerUnit)}</td>
                  <td style={{ padding: '0.75rem' }}>{po.qty ?? '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{po.mesin || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{po.supplier || '—'}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }} title={po.status}>
                    {getPOStatusLabel(po.status)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => setViewPoId(po.id)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                        onClick={() => {
                          if (window.confirm(`Hapus PO ${po.noRegistrasi}?`)) {
                            fetch(apiUrl(`/api/purchase-orders/${po.id}`), { method: 'DELETE' })
                              .then((r) => { if (r.ok) load() })
                              .catch(() => {})
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length > 0
              ? `Menampilkan ${filtered.length} dari ${list.length} PO${statusFilter || search.trim() ? ' (filter aktif)' : ''}`
              : 'Tidak ada PO yang sesuai filter.'}
          </div>
        )}
      </div>

      {historyOpen && (
        <HistoryPOModal onClose={() => setHistoryOpen(false)} />
      )}
      {modalOpen && (
        <CreatePOModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
      {viewPoId && (
        <ViewPOModal
          poId={viewPoId}
          onClose={() => setViewPoId(null)}
          onSuccess={() => {
            setViewPoId(null)
            load()
          }}
        />
      )}
    </div>
  )
}
