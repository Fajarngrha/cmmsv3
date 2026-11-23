import { useState } from 'react'
import { apiUrl } from '../api'
import { WarehouseConfirmModal } from './WarehouseConfirmModal'

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

interface ReceiveSparePartModalProps {
  part: SparePart
  onClose: () => void
  onSuccess: () => void
}

export function ReceiveSparePartModal({ part, onClose, onSuccess }: ReceiveSparePartModalProps) {
  const [qty, setQty] = useState<number | ''>(1)
  const [pic, setPic] = useState('')
  const [reason, setReason] = useState('')
  const [awaitingWarehouse, setAwaitingWarehouse] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const qtyNum = qty === '' ? 0 : Number(qty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Qty masuk harus bilangan bulat positif.')
      return
    }
    setAwaitingWarehouse(true)
  }

  const submitWithWarehouse = (warehouseName: string, warehousePassword: string) => {
    setSubmitting(true)
    setError('')
    fetch(apiUrl(`/api/inventory/spare-parts/${part.id}/receive`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qty: qtyNum,
        pic: pic.trim() || undefined,
        reason: reason.trim() || undefined,
        warehouseName,
        warehousePassword,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal mencatat stok masuk') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => {
        setError(err.message || 'Gagal mencatat stok masuk.')
        setAwaitingWarehouse(true)
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receive-sparepart-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-content" style={{ maxWidth: 440 }}>
          <div className="modal-header">
            <h2 id="receive-sparepart-title">Masuk Spare Part</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
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
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="receive-qty">Qty masuk *</label>
              <input
                id="receive-qty"
                className="input"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="receive-pic">PIC (opsional)</label>
              <input
                id="receive-pic"
                className="input"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Nama penanggung jawab"
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="receive-reason">Keterangan (opsional)</label>
              <input
                id="receive-reason"
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Penerimaan PO, retur"
              />
            </div>
            {error && !awaitingWarehouse && (
              <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary">OK</button>
            </div>
          </form>
        </div>
      </div>
      {awaitingWarehouse && (
        <WarehouseConfirmModal
          title="Validasi Gudang"
          subtitle="Tim gudang mengisi nama dan password untuk mengesahkan barang masuk."
          submitting={submitting}
          serverError={error}
          onCancel={() => {
            if (submitting) return
            setAwaitingWarehouse(false)
            setError('')
          }}
          onConfirm={submitWithWarehouse}
        />
      )}
    </>
  )
}
