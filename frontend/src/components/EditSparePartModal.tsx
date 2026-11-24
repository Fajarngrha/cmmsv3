import { useState } from 'react'
import { apiUrl } from '../api'
import { INVENTORY_SECTIONS } from '../constants/sections'

interface SparePart {
  id: string
  partCode: string
  name: string
  section?: string
  category: string
  stock: number
  minStock: number
  unit?: string
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
  const [section, setSection] = useState(part.section || 'Umum')
  const [spec, setSpec] = useState(part.spec ?? '')
  const [forMachine, setForMachine] = useState(part.forMachine ?? '')
  const [category, setCategory] = useState(part.category)
  const [stock, setStock] = useState<number | ''>(part.stock)
  const [minStock, setMinStock] = useState<number | ''>(part.minStock)
  const [location, setLocation] = useState(part.location ?? '')
  const [awaitingManager, setAwaitingManager] = useState(false)
  const [managerName, setManagerName] = useState('')
  const [managerPassword, setManagerPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const stockNum = stock === '' ? NaN : Number(stock)
  const min = minStock === '' ? 0 : Number(minStock)

  const validateForm = () => {
    if (!name.trim()) {
      setError('Nama spare part wajib diisi.')
      return false
    }
    if (!category.trim()) {
      setError('Kategori wajib diisi.')
      return false
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError('Stock harus bilangan bulat >= 0.')
      return false
    }
    if (!Number.isInteger(min) || min < 0) {
      setError('Min stock harus bilangan bulat >= 0.')
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setManagerName('')
    setManagerPassword('')
    setAwaitingManager(true)
  }

  const saveWithManager = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!managerName.trim() || !managerPassword) {
      setError('Manager dan password wajib diisi.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl(`/api/inventory/spare-parts/${part.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        section: section.trim() || 'Umum',
        spec,
        forMachine,
        category: category.trim(),
        stock: stockNum,
        minStock: min,
        location: location.trim(),
        managerName: managerName.trim(),
        managerPassword,
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
      onClick={(e) => e.target === e.currentTarget && !awaitingManager && !submitting && onClose()}
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
            <label className="label" htmlFor="edit-section">Section *</label>
            <select
              id="edit-section"
              className="select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              required
            >
              {INVENTORY_SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {section && !INVENTORY_SECTIONS.includes(section as (typeof INVENTORY_SECTIONS)[number]) && (
                <option value={section}>{section}</option>
              )}
            </select>
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

          <div className="form-group">
            <label className="label" htmlFor="edit-stock">Stock aktual *</label>
            <input
              id="edit-stock"
              className="input"
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Isi jumlah fisik saat ini. Unit: {part.unit || 'pcs'}. Stok sistem sekarang: {part.stock}.
            </p>
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

          {error && !awaitingManager && (
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
      {awaitingManager && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manager-confirm-title"
          style={{ zIndex: 80 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setAwaitingManager(false)
              setError('')
            }
          }}
        >
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 id="manager-confirm-title">Validasi Manager</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Tutup"
                disabled={submitting}
                onClick={() => {
                  setAwaitingManager(false)
                  setError('')
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={saveWithManager} style={{ padding: '0 1.25rem 1.25rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                Perubahan stok {part.partCode} dari {part.stock} menjadi {stockNum} {part.unit || 'pcs'} perlu disetujui manager.
              </p>
              <div className="form-group">
                <label className="label" htmlFor="manager-name">Manager *</label>
                <input
                  id="manager-name"
                  className="input"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Username atau nama manager"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="manager-password">Password *</label>
                <input
                  id="manager-password"
                  className="input"
                  type="password"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  placeholder="Password akun manager"
                  autoComplete="off"
                  required
                />
              </div>
              {error && (
                <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem', color: '#991b1b' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => {
                    setAwaitingManager(false)
                    setError('')
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'OK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
