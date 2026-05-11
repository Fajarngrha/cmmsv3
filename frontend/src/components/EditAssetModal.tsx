import { useMemo, useState } from 'react'
import { apiFetch, apiUrl } from '../api'
import { hitungUsiaMesin } from '../utils/assetAge'

interface Asset {
  id: string
  assetId: string
  name: string
  section: string
  maker?: string
  model?: string
  flowCapacity?: number
  lastPmDate: string
  nextPmDate: string
  installedAt?: string
}

interface EditAssetModalProps {
  asset: Asset
  onClose: () => void
  onSuccess: () => void
}

const SECTIONS = ['Molding','Molding ZNDC', 'Molding Sekei','Die Casting', 'PM Finishing', 'PM Lathe Cam & Boss','Heat Treatment',
  '3 Set Assy','Machine 1','Machine 2','Press', 'Pulley Assy', 'Kariseikei', 'QC']
const BULAN_OPTIONS = [
  { value: '', label: '-- Pilih Bulan --' },
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const TAHUN_OPTIONS = Array.from({ length: 50 }, (_, i) => currentYear - i)

function parseInstalledDate(installedAt?: string): { month: string; year: string } {
  if (!installedAt || !/^\d{4}-\d{2}-\d{2}$/.test(installedAt)) return { month: '', year: '' }
  const [year, month] = installedAt.split('-')
  return { month: String(Number(month)), year }
}

export function EditAssetModal({ asset, onClose, onSuccess }: EditAssetModalProps) {
  const initialInstalled = parseInstalledDate(asset.installedAt)
  const [assetId, setAssetId] = useState(asset.assetId)
  const [name, setName] = useState(asset.name)
  const [section, setSection] = useState(asset.section)
  const [maker, setMaker] = useState(asset.maker || '')
  const [model, setModel] = useState(asset.model || '')
  const [flowCapacity, setFlowCapacity] = useState(asset.flowCapacity != null ? String(asset.flowCapacity) : '')
  const [installedMonth, setInstalledMonth] = useState(initialInstalled.month)
  const [installedYear, setInstalledYear] = useState(initialInstalled.year)
  const [lastPmDate, setLastPmDate] = useState(asset.lastPmDate || '')
  const [nextPmDate, setNextPmDate] = useState(asset.nextPmDate || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const installedAtValue = useMemo(() => {
    if (!installedMonth || !installedYear) return ''
    return `${installedYear}-${String(installedMonth).padStart(2, '0')}-01`
  }, [installedMonth, installedYear])
  const isCompressorAsset = useMemo(() => {
    const keyword = name.trim().toLowerCase()
    return keyword.includes('compressor') || keyword.includes('kompressor')
  }, [name])
  const parsedFlowCapacity = useMemo(() => {
    const value = flowCapacity.trim()
    if (!value) return undefined
    const normalized = value.replace(',', '.')
    const num = Number(normalized)
    if (!Number.isFinite(num) || num < 0) return NaN
    return num
  }, [flowCapacity])
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
    if (!installedAtValue) {
      setError('Bulan & Tahun instalasi wajib dipilih.')
      return
    }
    if (isCompressorAsset) {
      if (!maker.trim()) {
        setError('Maker wajib diisi untuk asset kompresor.')
        return
      }
      if (!model.trim()) {
        setError('Model wajib diisi untuk asset kompresor.')
        return
      }
      if (flowCapacity.trim() && Number.isNaN(parsedFlowCapacity)) {
        setError('Kapasitas Debit harus berupa angka valid.')
        return
      }
    }
    setSubmitting(true)
    apiFetch(apiUrl(`/api/assets/${asset.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: assetId.trim() || undefined,
        name: name.trim(),
        section,
        maker: maker.trim() || null,
        model: model.trim() || null,
        flowCapacity: flowCapacity.trim() ? parsedFlowCapacity : null,
        lastPmDate: lastPmDate.trim() || undefined,
        nextPmDate: nextPmDate.trim() || undefined,
        installedAt: installedAtValue,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal mengubah asset') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal mengubah asset. Silakan coba lagi.'))
      .finally(() => setSubmitting(false))
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-asset-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="edit-asset-title">Edit Asset</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="assetId">Asset ID</label>
            <input id="assetId" className="input" type="text" value={assetId} onChange={(e) => setAssetId(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="name">Nama *</label>
            <input id="name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="section">Section *</label>
            <select id="section" className="select" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">-- Pilih Section --</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {(isCompressorAsset || maker || model || flowCapacity) && (
            <>
              <div className="form-group">
                <label className="label" htmlFor="maker">Maker *</label>
                <input id="maker" className="input" type="text" value={maker} onChange={(e) => setMaker(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="model">Model *</label>
                <input id="model" className="input" type="text" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="flowCapacity">Kapasitas Debit (m3/Min)</label>
                <input
                  id="flowCapacity"
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={flowCapacity}
                  onChange={(e) => setFlowCapacity(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="label">Bulan & Tahun Instalasi</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select className="select" value={installedMonth} onChange={(e) => setInstalledMonth(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value || 'x'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select className="select" value={installedYear} onChange={(e) => setInstalledYear(e.target.value)} style={{ flex: 1, minWidth: 100 }}>
                <option value="">-- Tahun --</option>
                {TAHUN_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Usia Mesin</label>
            <div className="input" style={{ background: '#f1f5f9', color: '#475569', cursor: 'default' }} aria-readonly>
              {usiaMesin}
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="lastPm">Last PM</label>
            <input id="lastPm" className="input" type="date" value={lastPmDate} onChange={(e) => setLastPmDate(e.target.value)} max={today} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="nextPm">Next PM</label>
            <input id="nextPm" className="input" type="date" value={nextPmDate} onChange={(e) => setNextPmDate(e.target.value)} min={today} />
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
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
