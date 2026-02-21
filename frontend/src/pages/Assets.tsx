import { useEffect, useRef, useState } from 'react'
import { apiUrl } from '../api'
import { CreateAssetModal } from '../components/CreateAssetModal'
import { ViewAssetModal } from '../components/ViewAssetModal'
import { hitungUsiaMesin } from '../utils/assetAge'
import { exportToCsv, parseCsvToObjects, type CsvColumn } from '../utils/exportToCsv'

interface Asset {
  id: string
  assetId: string
  name: string
  section: string
  health: 'Running' | 'Warning' | 'Breakdown'
  lastPmDate: string
  nextPmDate: string
  uptimePercent: number
  installedAt?: string
}

const ROWS_PER_PAGE = 50

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('')
  const [sectionFilter, setSectionFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewAsset, setViewAsset] = useState<Asset | null>(null)
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    fetch(apiUrl('/api/assets'))
      .then((r) => r.json())
      .then((data) => {
        setAssets(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const sections = [...new Set(assets.map((a) => a.section))].sort()

  const normalizeHealth = (v: string): 'Running' | 'Warning' | 'Breakdown' => {
    const s = (v || '').trim().toLowerCase()
    if (s === 'running') return 'Running'
    if (s === 'warning' || s === 'needs attention') return 'Warning'
    if (s === 'breakdown' || s === 'out of service') return 'Breakdown'
    return 'Running'
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportMessage(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage({ type: 'err', text: 'Pilih file CSV (.csv).' })
      return
    }
    setImporting(true)
    const reader = new FileReader()
    reader.onload = () => {
      const text = (reader.result as string) || ''
      try {
        const rows = parseCsvToObjects(text)
        const payload = rows
          .filter((r) => (r['Nama'] ?? r['name'] ?? '').trim() && (r['Section'] ?? r['section'] ?? '').trim())
          .map((r) => ({
            assetId: (r['Asset ID'] ?? r['assetId'] ?? '').trim() || undefined,
            name: (r['Nama'] ?? r['name'] ?? '').trim(),
            section: (r['Section'] ?? r['section'] ?? '').trim(),
            lastPmDate: (r['Last PM'] ?? r['lastPmDate'] ?? '').trim() || undefined,
            nextPmDate: (r['Next PM'] ?? r['nextPmDate'] ?? '').trim() || undefined,
            health: normalizeHealth(r['Health'] ?? r['health'] ?? ''),
            installedAt: (r['Installed At'] ?? r['installedAt'] ?? '').trim() || undefined,
          }))
        if (payload.length === 0) {
          setImporting(false)
          setImportMessage({ type: 'err', text: 'Tidak ada baris valid (Nama dan Section wajib).' })
          return
        }
        fetch(apiUrl('/api/assets/import'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assets: payload }),
        })
          .then((res) => res.json())
          .then((data) => {
            load()
            setImportMessage({ type: 'ok', text: `${data.imported ?? 0} asset berhasil diimpor.` })
          })
          .catch(() => setImportMessage({ type: 'err', text: 'Gagal mengimpor. Periksa koneksi atau format data.' }))
          .finally(() => setImporting(false))
      } catch {
        setImporting(false)
        setImportMessage({ type: 'err', text: 'Format CSV tidak valid.' })
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.assetId.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
    const matchHealth = !healthFilter || a.health === healthFilter
    const matchSection = !sectionFilter || a.section === sectionFilter
    return matchSearch && matchHealth && matchSection
  })
  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ROWS_PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = (safePage - 1) * ROWS_PER_PAGE
  const paginated = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [search, healthFilter, sectionFilter])

  const running = assets.filter((a) => a.health === 'Running').length
  const warning = assets.filter((a) => a.health === 'Warning').length
  const breakdown = assets.filter((a) => a.health === 'Breakdown').length

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Assets</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Monitor asset health and prioritize maintenance activities
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="grid-4" style={{ flex: 1, minWidth: 200 }}>
          <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Running</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{running}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #eab308' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Needs Attention</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{warning}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Out of Service</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{breakdown}</div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Assets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{assets.length}</div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const columns: CsvColumn<Asset>[] = [
              { header: 'Asset ID', key: 'assetId' },
              { header: 'Nama', key: 'name' },
              { header: 'Section', key: 'section' },
              { header: 'Usia Mesin', getValue: (a) => hitungUsiaMesin(a.installedAt) },
              { header: 'Last PM', key: 'lastPmDate' },
              { header: 'Next PM', key: 'nextPmDate' },
              { header: 'Health', key: 'health' },
            ]
            exportToCsv(filtered, columns, `assets-${new Date().toISOString().slice(0, 10)}.csv`)
          }}
        >
          Export to CSV
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          {importing ? 'Mengimpor...' : 'Import data'}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Tambah Asset
        </button>
      </div>
      {importMessage && (
        <p
          style={{
            margin: '-0.5rem 0 1rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 6,
            fontSize: '0.9rem',
            background: importMessage.type === 'ok' ? '#dcfce7' : '#fee2e2',
            color: importMessage.type === 'ok' ? '#166534' : '#991b1b',
          }}
        >
          {importMessage.text}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="search"
          className="input"
          placeholder="Cari asset ID atau nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select
          className="select"
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">Semua Status</option>
          <option value="Running">Running</option>
          <option value="Warning">Warning</option>
          <option value="Breakdown">Breakdown</option>
        </select>
        <select
          className="select"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="">Semua Section</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Asset ID</th>
                <th style={{ padding: '0.75rem' }}>Nama</th>
                <th style={{ padding: '0.75rem' }}>Section</th>
                <th style={{ padding: '0.75rem' }}>Usia Mesin</th>
                <th style={{ padding: '0.75rem' }}>Last PM</th>
                <th style={{ padding: '0.75rem' }}>Next PM</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <a href="#" style={{ color: '#3b82f6', fontWeight: 500 }}>{a.assetId}</a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{a.name}</td>
                    <td style={{ padding: '0.75rem' }}>{a.section}</td>
                    <td style={{ padding: '0.75rem' }}>{hitungUsiaMesin(a.installedAt)}</td>
                    <td style={{ padding: '0.75rem' }}>{a.lastPmDate}</td>
                    <td style={{ padding: '0.75rem' }}>{a.nextPmDate}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => setViewAsset(a)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                          onClick={() => {
                            if (window.confirm(`Hapus asset ${a.assetId} (${a.name})?`)) {
                              fetch(apiUrl(`/api/assets/${a.id}`), { method: 'DELETE' })
                                .then((r) => { if (r.ok) load() })
                                .catch(() => {})
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span>
              {totalFiltered > 0
                ? `Menampilkan ${startIdx + 1}-${startIdx + paginated.length} dari ${totalFiltered} assets`
                : 'Tidak ada asset yang sesuai filter.'}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Sebelumnya
                </button>
                <span style={{ whiteSpace: 'nowrap' }}>Halaman {safePage} dari {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <CreateAssetModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
      {viewAsset && (
        <ViewAssetModal asset={viewAsset} onClose={() => setViewAsset(null)} />
      )}
    </div>
  )
}
