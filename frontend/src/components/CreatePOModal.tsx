import { useState, useMemo } from 'react'
import { apiUrl } from '../api'

interface CreatePOModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface PoItemRow {
  id: string
  itemDeskripsi: string
  model: string
  hargaPerUnit: number | ''
  qty: number | ''
}

const KATEGORI_OPTIONS: { value: 'Preventive' | 'Sparepart' | 'Breakdown/Repair'; label: string }[] = [
  { value: 'Preventive', label: 'Preventive' },
  { value: 'Sparepart', label: 'Sparepart' },
  { value: 'Breakdown/Repair', label: 'Breakdown/Repair' },
]
import { PO_STATUS_OPTIONS, type POStatusValue } from '../utils/poStatus'

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const initialRow = (): PoItemRow => ({
  id: generateRowId(),
  itemDeskripsi: '',
  model: '',
  hargaPerUnit: '',
  qty: '',
})

export function CreatePOModal({ onClose, onSuccess }: CreatePOModalProps) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<PoItemRow[]>([initialRow()])
  const [noPO, setNoPO] = useState('')
  const [mesin, setMesin] = useState('')
  const [noQuotation, setNoQuotation] = useState('')
  const [supplier, setSupplier] = useState('')
  const [kategori, setKategori] = useState<'Preventive' | 'Sparepart' | 'Breakdown/Repair'>('Sparepart')
  const [status, setStatus] = useState<POStatusValue>('Tahap 1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalHarga = useMemo(() => {
    return items.reduce((sum, row) => {
      const h = typeof row.hargaPerUnit === 'number' ? row.hargaPerUnit : Number(row.hargaPerUnit) || 0
      const q = typeof row.qty === 'number' ? row.qty : Number(row.qty) || 0
      return sum + h * q
    }, 0)
  }, [items])

  const updateRow = (id: string, updates: Partial<PoItemRow>) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const addRow = () => setItems((prev) => [...prev, initialRow()])

  const removeRow = (id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const formatIdr = (n: number) =>
    'Rp. ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const rowsToSubmit = items.filter((r) => r.itemDeskripsi.trim())
    if (rowsToSubmit.length === 0) {
      setError('Minimal satu Item Deskripsi wajib diisi.')
      return
    }
    setSubmitting(true)
    const payloads = rowsToSubmit.map((r) => ({
      tanggal,
      itemDeskripsi: r.itemDeskripsi.trim(),
      model: r.model.trim(),
      hargaPerUnit: typeof r.hargaPerUnit === 'number' ? r.hargaPerUnit : Number(r.hargaPerUnit) || 0,
      qty: typeof r.qty === 'number' ? r.qty : Number(r.qty) || 0,
      noPO: noPO.trim(),
      mesin: mesin.trim(),
      noQuotation: noQuotation.trim(),
      supplier: supplier.trim(),
      kategori,
      status,
    }))
    Promise.all(
      payloads.map((body) =>
        fetch(apiUrl('/api/purchase-orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then((r) => {
          if (!r.ok) return r.json().then((e: { error?: string }) => { throw new Error(e.error || 'Gagal menambah PO') })
          return r.json()
        })
      )
    )
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menambah PO. Silakan coba lagi.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-po-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 id="create-po-title">Tambah Purchase Order (Tracking PO)</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p style={{ padding: '0 1.25rem', fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
          No Registrasi akan digenerate otomatis dengan format MTC/SPB/MM/YY/XXXX.
        </p>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="po-tanggal">Tanggal *</label>
            <input
              id="po-tanggal"
              className="input"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>

          {items.map((row, index) => (
            <div key={row.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Item {index + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => removeRow(row.id)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                    aria-label="Hapus baris"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="form-group">
                <label className="label" htmlFor={`po-item-${row.id}`}>Item Deskripsi *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    id={`po-item-${row.id}`}
                    className="input"
                    type="text"
                    value={row.itemDeskripsi}
                    onChange={(e) => updateRow(row.id, { itemDeskripsi: e.target.value })}
                    placeholder="e.g. Ball Bearing 6205"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addRow}
                    title="Tambah item pembelian"
                    style={{ flexShrink: 0, padding: '0.5rem 0.75rem', minWidth: 44 }}
                    aria-label="Tambah item"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="label" htmlFor={`po-model-${row.id}`}>Model</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    id={`po-model-${row.id}`}
                    className="input"
                    type="text"
                    value={row.model}
                    onChange={(e) => updateRow(row.id, { model: e.target.value })}
                    placeholder="e.g. SKF 6205-2RS"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addRow}
                    title="Tambah item pembelian"
                    style={{ flexShrink: 0, padding: '0.5rem 0.75rem', minWidth: 44 }}
                    aria-label="Tambah item"
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor={`po-harga-${row.id}`}>Harga / Unit (Rp)</label>
                  <input
                    id={`po-harga-${row.id}`}
                    className="input"
                    type="number"
                    min={0}
                    value={row.hargaPerUnit}
                    onChange={(e) => updateRow(row.id, { hargaPerUnit: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor={`po-qty-${row.id}`}>Qty</label>
                  <input
                    id={`po-qty-${row.id}`}
                    className="input"
                    type="number"
                    min={0}
                    value={row.qty}
                    onChange={(e) => updateRow(row.id, { qty: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
            <strong>Total Harga (semua item):</strong> {formatIdr(totalHarga)}
          </div>
          <div className="form-group">
            <label className="label">No Registrasi</label>
            <input className="input" type="text" value="Auto (MTC/SPB/MM/YY/XXXX)" readOnly disabled style={{ opacity: 0.8 }} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="po-nopo">No PO</label>
            <input
              id="po-nopo"
              className="input"
              type="text"
              value={noPO}
              onChange={(e) => setNoPO(e.target.value)}
              placeholder="e.g. PO-2024-001"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="po-mesin">Mesin</label>
            <input
              id="po-mesin"
              className="input"
              type="text"
              value={mesin}
              onChange={(e) => setMesin(e.target.value)}
              placeholder="e.g. Conveyor Belt A"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="po-quotation">No Quotation</label>
            <input
              id="po-quotation"
              className="input"
              type="text"
              value={noQuotation}
              onChange={(e) => setNoQuotation(e.target.value)}
              placeholder="e.g. QUO-2024-015"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="po-supplier">Supplier</label>
            <input
              id="po-supplier"
              className="input"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. PT Teknik Jaya"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="po-kategori">Kategori</label>
              <select
                id="po-kategori"
                className="select"
                value={kategori}
                onChange={(e) => setKategori(e.target.value as 'Preventive' | 'Sparepart' | 'Breakdown/Repair')}
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="po-status">Status</label>
              <select
                id="po-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as POStatusValue)}
              >
                {PO_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
              {submitting ? 'Menyimpan...' : 'Tambah PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
