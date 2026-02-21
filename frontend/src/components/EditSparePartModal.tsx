import { useState } from 'react'
import { apiUrl } from '../api'

interface SparePart {
  id: string
  partCode: string
  name: string
  category: string
  minStock: number
  location: string
  spec?: string
  forMachine?: string
}

interface EditSparePartModalProps {
  part: SparePart
  onClose: () => void
  onSuccess: () => void
}

export function EditSparePartModal({ part, onClose, onSuccess }: EditSparePartModalProps) {
  const [name, setName] = useState(part.name)
  const [spec, setSpec] = useState(part.spec ?? '')
  const [forMachine, setForMachine] = useState(part.forMachine ?? '')
  const [category, setCategory] = useState(part.category)
  const [minStock, setMinStock] = useState<number | ''>(part.minStock)
  const [location, setLocation] = useState(part.location ?? '')
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
    const min = minStock === '' ? 0 : Number(minStock)
    if (!Number.isInteger(min) || min < 0) {
      setError('Min stock harus bilangan bulat >= 0.')
      return
    }

    setSubmitting(true)
    fetch(apiUrl(`/api/inventory/spare-parts/${part.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        spec,
        forMachine,
        category: category.trim(),
        minStock: min,
        location: location.trim(),
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((data) => { throw new Error(data.error || 'Gagal mengubah spare part') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menyimpan perubahan.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sparepart-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="edit-sparepart-title">Edit Spare Part - {part.partCode}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="edit-name">Nama *</label>
            <input
              id="edit-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="edit-spec">Spesifikasi</label>
            <input
              id="edit-spec"
              className="input"
              type="text"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="edit-machine">Untuk Mesin</label>
            <input
              id="edit-machine"
              className="input"
              type="text"
              value={forMachine}
              onChange={(e) => setForMachine(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="edit-category">Category *</label>
              <input
                id="edit-category"
                className="input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="edit-min-stock">Min Stock</label>
              <input
                id="edit-min-stock"
                className="input"
                type="number"
                min={0}
                step={1}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="edit-location">Lokasi</label>
              <input
                id="edit-location"
                className="input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
