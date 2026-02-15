import { useEffect, useState } from 'react'
import { apiUrl } from '../api'

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

interface HistoryPOModalProps {
  onClose: () => void
}

function formatIdr(n: number) {
  return 'Rp. ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function HistoryPOModal({ onClose }: HistoryPOModalProps) {
  const [list, setList] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/purchase-orders'))
      .then((r) => r.json())
      .then((data: PurchaseOrder[]) => {
        setList(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = list.filter((po) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      (po.itemDeskripsi ?? '').toLowerCase().includes(term) ||
      (po.model ?? '').toLowerCase().includes(term) ||
      (po.supplier ?? '').toLowerCase().includes(term) ||
      (po.mesin ?? '').toLowerCase().includes(term)
    )
  })

  const sortedByItemThenPrice = [...filtered].sort((a, b) => {
    const itemA = (a.itemDeskripsi ?? '').toLowerCase()
    const itemB = (b.itemDeskripsi ?? '').toLowerCase()
    if (itemA !== itemB) return itemA.localeCompare(itemB)
    return a.hargaPerUnit - b.hargaPerUnit
  })

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-po-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 960, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 id="history-po-title">History Pembelian</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <p style={{ padding: '0 1.25rem', fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>
          Cari item
        </p>

        <div style={{ padding: '0 1.25rem 1rem' }}>
          <input
            type="search"
            className="input"
            placeholder="Cari item, model, atau supplier (contoh: bearing, oil, filter)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 480 }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 1.25rem 1.25rem' }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Memuat history...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Tanggal</th>
                  <th style={{ padding: '0.75rem' }}>Item Deskripsi</th>
                  <th style={{ padding: '0.75rem' }}>Model</th>
                  <th style={{ padding: '0.75rem' }}>Harga/Unit</th>
                  <th style={{ padding: '0.75rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem' }}>Total Harga</th>
                  <th style={{ padding: '0.75rem' }}>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {sortedByItemThenPrice.map((po) => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>{po.tanggal}</td>
                    <td style={{ padding: '0.75rem', maxWidth: 220 }} title={po.itemDeskripsi}>
                      {po.itemDeskripsi || '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{po.model || '—'}</td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatIdr(po.hargaPerUnit)}</td>
                    <td style={{ padding: '0.75rem' }}>{po.qty ?? '—'}</td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatIdr(po.totalHarga)}</td>
                    <td style={{ padding: '0.75rem' }}>{po.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && (
            <div style={{ padding: '0.75rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              {filtered.length > 0
                ? `Menampilkan ${filtered.length} pembelian${search.trim() ? ` (filter: "${search}")` : ''}. Diurutkan per item lalu harga terendah.`
                : search.trim()
                  ? `Tidak ada pembelian yang cocok dengan "${search}".`
                  : 'Belum ada data pembelian.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
