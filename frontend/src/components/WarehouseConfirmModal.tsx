import { FormEvent, useState } from 'react'

interface WarehouseConfirmModalProps {
  title: string
  subtitle?: string
  submitting?: boolean
  serverError?: string
  onCancel: () => void
  onConfirm: (name: string, password: string) => void
}

export function WarehouseConfirmModal({
  title,
  subtitle,
  submitting = false,
  serverError = '',
  onCancel,
  onConfirm,
}: WarehouseConfirmModalProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) {
      setError('Nama dan password gudang wajib diisi.')
      return
    }
    setError('')
    onConfirm(name.trim(), password)
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-confirm-title"
      style={{ zIndex: 80 }}
      onClick={(e) => e.target === e.currentTarget && !submitting && onCancel()}
    >
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 id="warehouse-confirm-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Tutup" disabled={submitting}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.9rem' }}>
            {subtitle || 'Diisi oleh tim gudang untuk validasi barang masuk/keluar.'}
          </p>
          <div className="form-group">
            <label className="label" htmlFor="warehouse-name">Nama *</label>
            <input
              id="warehouse-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama / username tim gudang"
              autoComplete="off"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="warehouse-password">Password *</label>
            <input
              id="warehouse-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password akun gudang"
              autoComplete="off"
              required
            />
          </div>
          {(error || serverError) && (
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error || serverError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Memvalidasi...' : 'OK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
