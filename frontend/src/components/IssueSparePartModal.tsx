import { useState } from 'react'
import { apiUrl } from '../api'

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

interface IssueSparePartModalProps {
  part: SparePart
  onClose: () => void
  onSuccess: () => void
}

export function IssueSparePartModal({ part, onClose, onSuccess }: IssueSparePartModalProps) {
  const [qty, setQty] = useState<number | ''>(1)
  const [pic, setPic] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const maxQty = part.stock
  const qtyNum = qty === '' ? 0 : Number(qty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!pic.trim()) {
      setError('PIC wajib diisi.')
      return
    }
    if (qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Jumlah keluar harus bilangan bulat positif.')
      return
    }
    if (qtyNum > maxQty) {
      setError(`Stock tidak cukup. Tersedia: ${maxQty} ${part.unit}.`)
      return
    }
    setSubmitting(true)
    fetch(apiUrl(`/api/inventory/spare-parts/${part.id}/issue`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: qtyNum, pic: pic.trim(), reason: reason.trim() || undefined }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal mengeluarkan spare part') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal mengeluarkan spare part.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-sparepart-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 id="issue-sparepart-title">Keluar Spare Part</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div style={{ padding: '0 1.25rem', marginBottom: '1rem' }}>
          <div className="wo-detail-section" style={{ marginBottom: '1rem' }}>
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">Part Code</span>
                <span className="wo-detail-value">{part.partCode}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Nama</span>
                <span className="wo-detail-value">{part.name}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Stock saat ini</span>
                <span className="wo-detail-value">{part.stock} {part.unit}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Location</span>
                <span className="wo-detail-value muted">{part.location || '—'}</span>
              </div>
              {part.spec && (
                <div className="wo-detail-row">
                  <span className="wo-detail-label">Spesifikasi Part</span>
                  <span className="wo-detail-value muted">{part.spec}</span>
                </div>
              )}
              {part.forMachine && (
                <div className="wo-detail-row">
                  <span className="wo-detail-label">Untuk Mesin</span>
                  <span className="wo-detail-value muted">{part.forMachine}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="qty">Jumlah keluar *</label>
            <input
              id="qty"
              className="input"
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1"
              required
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Maksimal: {maxQty} {part.unit}
            </p>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="pic">PIC *</label>
            <input
              id="pic"
              className="input"
              type="text"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              placeholder="Nama penanggung jawab"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="reason">Keterangan (opsional)</label>
            <input
              id="reason"
              className="input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Untuk Req1042, perbaikan Motor Listrik"
            />
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Keluar Spare Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
