import { useState } from 'react'
import { apiUrl } from '../api'

interface SparePart {
  id: string
  partCode: string
  name: string
  section?: string
  category: string
  stock: number
  minStock: number
  unit: string
  location: string
  spec?: string
  forMachine?: string
}

interface ReceiveSparePartModalProps {
  part: SparePart
  onClose: () => void
  onSuccess: () => void
}

export function ReceiveSparePartModal({ part, onClose, onSuccess }: ReceiveSparePartModalProps) {
  const [qty, setQty] = useState<number | ''>(1)
  const [nama, setNama] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const qtyNum = qty === '' ? 0 : Number(qty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!nama.trim()) {
      setError('Nama wajib diisi.')
      return
    }
    if (qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Jumlah masuk harus bilangan bulat positif.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl(`/api/inventory/spare-parts/${part.id}/receive`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qty: qtyNum,
        pic: nama.trim(),
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((err) => { throw new Error(err.error || 'Gagal mencatat stok masuk') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal mencatat stok masuk.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-sparepart-title"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 id="receive-sparepart-title">Masuk Spare Part</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup" disabled={submitting}>
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
                <span className="wo-detail-label">Section</span>
                <span className="wo-detail-value">{part.section || 'Umum'}</span>
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
            <label className="label" htmlFor="receive-nama">Nama *</label>
            <input
              id="receive-nama"
              className="input"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama penerima / PIC"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="receive-qty">Jumlah *</label>
            <input
              id="receive-qty"
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1"
              required
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Unit: {part.unit}
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Masuk Spare Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
