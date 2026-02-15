import { useState, useEffect } from 'react'
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

interface ViewPOModalProps {
  poId: string
  onClose: () => void
  onSuccess: () => void
}

import { PO_STATUS_OPTIONS } from '../utils/poStatus'

function formatIdr(n: number) {
  return 'Rp. ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function ViewPOModal({ poId, onClose, onSuccess }: ViewPOModalProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [noPO, setNoPO] = useState('')
  const [status, setStatus] = useState('')
  const [noQuotation, setNoQuotation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(apiUrl(`/api/purchase-orders/${poId}`))
      .then((r) => {
        if (!r.ok) throw new Error('PO tidak ditemukan')
        return r.json()
      })
      .then((data) => {
        setPo(data)
        setNoPO(data.noPO ?? '')
        setStatus(data.status ?? 'Tahap 1')
        setNoQuotation(data.noQuotation ?? '')
      })
      .catch(() => setError('Gagal memuat data PO.'))
      .finally(() => setLoading(false))
  }, [poId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!po) return
    setError('')
    setSaving(true)
    fetch(apiUrl(`/api/purchase-orders/${poId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noPO: noPO.trim(),
        status,
        noQuotation: noQuotation.trim(),
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal menyimpan') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menyimpan.'))
      .finally(() => setSaving(false))
  }

  if (loading || !po) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content" style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <h2 id="view-po-title">View / Edit PO</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            {error || 'Memuat...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-po-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 id="view-po-title">View / Edit PO — No. Registrasi {po.noRegistrasi}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div style={{ padding: '0 1.25rem', marginBottom: '1rem' }}>
          <div className="wo-detail-section">
            <h3 className="wo-detail-section-title">Data PO (read-only)</h3>
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">Tanggal</span>
                <span className="wo-detail-value">{po.tanggal}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Item Deskripsi</span>
                <span className="wo-detail-value">{po.itemDeskripsi}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Model</span>
                <span className="wo-detail-value muted">{po.model || '—'}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Harga/Unit</span>
                <span className="wo-detail-value">{formatIdr(po.hargaPerUnit)}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Qty</span>
                <span className="wo-detail-value">{po.qty}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Mesin</span>
                <span className="wo-detail-value muted">{po.mesin || '—'}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Supplier</span>
                <span className="wo-detail-value">{po.supplier || '—'}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Total Harga</span>
                <span className="wo-detail-value">{formatIdr(po.totalHarga)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            No PO biasanya diisi saat proses mencapai <strong>Tahap 5: Send Produksi</strong>. Edit di bawah lalu simpan.
          </p>
          <div className="form-group">
            <label className="label" htmlFor="view-po-noPO">No PO</label>
            <input
              id="view-po-noPO"
              className="input"
              type="text"
              value={noPO}
              onChange={(e) => setNoPO(e.target.value)}
              placeholder="e.g. PO-2024-001"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="view-po-quotation">No Quotation</label>
            <input
              id="view-po-quotation"
              className="input"
              type="text"
              value={noQuotation}
              onChange={(e) => setNoQuotation(e.target.value)}
              placeholder="e.g. QUO-2024-015"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="view-po-status">Status</label>
            <select
              id="view-po-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {PO_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
