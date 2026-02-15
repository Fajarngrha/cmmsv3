import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { CreateAssetModal } from '../components/CreateAssetModal'
import { ViewAssetModal } from '../components/ViewAssetModal'
import { hitungUsiaMesin } from '../utils/assetAge'

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

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('')
  const [sectionFilter, setSectionFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewAsset, setViewAsset] = useState<Asset | null>(null)

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

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.assetId.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
    const matchHealth = !healthFilter || a.health === healthFilter
    const matchSection = !sectionFilter || a.section === sectionFilter
    return matchSearch && matchHealth && matchSection
  })

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
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Tambah Asset
        </button>
      </div>

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
              {filtered.map((a) => (
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
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            Menampilkan {filtered.length} dari {assets.length} assets
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
