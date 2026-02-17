import { useState } from 'react'
import { apiUrl } from '../api'

interface AddSparePartModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = ['Bearings', 'Belts', 'Filters', 'Lubricants', 'Sensors', 'Lainnya']

export function AddSparePartModal({ onClose, onSuccess }: AddSparePartModalProps) {
  const [partCode, setPartCode] = useState('')
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [forMachine, setForMachine] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState<number | ''>(0)
  const [minStock, setMinStock] = useState<number | ''>(0)
  const [unit, setUnit] = useState('pcs')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama spare part wajib diisi.')
      return
    }
    if (!category.trim()) {
      setError('Kategori wajib diisi.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl('/api/inventory/spare-parts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partCode: partCode.trim() || undefined,
        name: name.trim(),
        spec: spec.trim() || undefined,
        forMachine: forMachine.trim() || undefined,
        category: category.trim(),
        stock: stock === '' ? 0 : Number(stock),
        minStock: minStock === '' ? 0 : Number(minStock),
        unit: unit.trim() || 'pcs',
        location: location.trim() || undefined,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal menambah spare part') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menambah spare part. Silakan coba lagi.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sparepart-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="add-sparepart-title">Tambah Spare Part</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <p style={{ padding: '0 1.25rem', fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
          auto-generate (PRT-001, PRT-002, ...).
        </p>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="partCode">Part Code</label>
            <input
              id="partCode"
              className="input"
              type="text"
              value={partCode}
              onChange={(e) => setPartCode(e.target.value)}
              placeholder="Kosongkan untuk auto-generate"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="name">Nama *</label>
            <input
              id="name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ball Bearing 6205"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="spec">Spesifikasi Part</label>
            <input
              id="spec"
              className="input"
              type="text"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="e.g. SKF 6205-2RS, 25mm ID, 52mm OD"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="forMachine">Untuk Mesin</label>
            <input
              id="forMachine"
              className="input"
              type="text"
              value={forMachine}
              onChange={(e) => setForMachine(e.target.value)}
              placeholder="e.g. Compressor Unit 1, Conveyor Belt A"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="category">Kategori *</label>
            <select
              id="category"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="stock">Stock Awal</label>
              <input
                id="stock"
                className="input"
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="minStock">Min Stock</label>
              <input
                id="minStock"
                className="input"
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="unit">Unit</label>
              <select
                id="unit"
                className="select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="pcs">pcs</option>
                <option value="L">L</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="set">set</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="location">Location</label>
              <input
                id="location"
                className="input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. A1-01"
              />
            </div>
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
              {submitting ? 'Menyimpan...' : 'Tambah Spare Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
