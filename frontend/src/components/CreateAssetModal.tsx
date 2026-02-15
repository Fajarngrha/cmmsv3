import { useState, useMemo } from 'react'
import { apiUrl } from '../api'
import { hitungUsiaMesin } from '../utils/assetAge'

interface CreateAssetModalProps {
  onClose: () => void
  onSuccess: () => void
}

const SECTIONS = ['Die Casting', 'Molding', 'Pulley Assy']
const BULAN_OPTIONS = [
  { value: '', label: '-- Pilih Bulan --' },
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const TAHUN_OPTIONS = Array.from({ length: 50 }, (_, i) => currentYear - i)

export function CreateAssetModal({ onClose, onSuccess }: CreateAssetModalProps) {
  const [assetId, setAssetId] = useState('')
  const [name, setName] = useState('')
  const [section, setSection] = useState('')
  const [installedMonth, setInstalledMonth] = useState('')
  const [installedYear, setInstalledYear] = useState('')
  const [lastPmDate, setLastPmDate] = useState('')
  const [nextPmDate, setNextPmDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const installedAtValue = useMemo(() => {
    if (!installedMonth || !installedYear) return ''
    return `${installedYear}-${String(installedMonth).padStart(2, '0')}-01`
  }, [installedMonth, installedYear])
  const usiaMesin = useMemo(() => hitungUsiaMesin(installedAtValue), [installedAtValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nama asset wajib diisi.')
      return
    }
    if (!section) {
      setError('Section wajib dipilih.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl('/api/assets'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: assetId.trim() || undefined,
        name: name.trim(),
        section,
        lastPmDate: lastPmDate.trim() || undefined,
        nextPmDate: nextPmDate.trim() || undefined,
        installedAt: installedAtValue || undefined,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal menambah asset') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menambah asset. Silakan coba lagi.'))
      .finally(() => setSubmitting(false))
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-asset-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="create-asset-title">Tambah Asset</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p style={{ padding: '0 1.25rem', fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
          Isi field sesuai kolom tabel asset. Asset ID dapat dikosongkan untuk auto-generate.
        </p>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="assetId">Asset ID</label>
            <input
              id="assetId"
              className="input"
              type="text"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="Kosongkan untuk auto-generate (e.g. AST-009)"
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
              placeholder="e.g. Compressor Unit 1"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="section">Section *</label>
            <select
              id="section"
              className="select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="">-- Pilih Section --</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Bulan & Tahun Instalasi</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                id="installedMonth"
                className="select"
                value={installedMonth}
                onChange={(e) => setInstalledMonth(e.target.value)}
                style={{ flex: 1, minWidth: 140 }}
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value || 'x'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                id="installedYear"
                className="select"
                value={installedYear}
                onChange={(e) => setInstalledYear(e.target.value)}
                style={{ flex: 1, minWidth: 100 }}
              >
                <option value="">-- Tahun --</option>
                {TAHUN_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Usia Mesin</label>
            <div
              className="input"
              style={{ background: '#f1f5f9', color: '#475569', cursor: 'default' }}
              aria-readonly
            >
              {usiaMesin}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Terkalkulasi otomatis dari bulan & tahun instalasi hingga sekarang.
            </span>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lastPm">Last PM</label>
            <input
              id="lastPm"
              className="input"
              type="date"
              value={lastPmDate}
              onChange={(e) => setLastPmDate(e.target.value)}
              max={today}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="nextPm">Next PM</label>
            <input
              id="nextPm"
              className="input"
              type="date"
              value={nextPmDate}
              onChange={(e) => setNextPmDate(e.target.value)}
              min={today}
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
              {submitting ? 'Menyimpan...' : 'Tambah Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
