import { useState, useEffect } from 'react'
import { apiUrl } from '../api'

export interface UpcomingPMDetail {
  id: string
  pmId: string
  assetName: string
  activity: string
  scheduledDate: string
  assignedTo: string
  assetSerialNumber?: string
  assetLocation?: string
  pmType?: string
  pmCategory?: string
  startTime?: string
  endTime?: string
  frequency?: string
  manpower?: number
  shiftSchedule?: string
  requiredEquipment?: string
  sparePartsList?: string
  detailedInstructions?: string
  proceduralDocLink?: string
  priority?: string
  pmStatus?: string
  approvalStatus?: string
  reminderEnabled?: boolean
  warningDays?: number
  specialNotes?: string
  feedback?: string
  managerApproval?: string
  auditTrail?: string
  photoUrls?: string
  reportGenerated?: boolean
  /** Keterangan: PM OK | Belum Selesai | Pending */
  keteranganStatus?: 'PM OK' | 'Belum Selesai' | 'Pending'
  /** Catatan jika Belum Selesai atau Pending */
  keteranganNotes?: string
}

interface ViewPMModalProps {
  pm: UpcomingPMDetail
  onClose: () => void
  onSuccess?: () => void
}

const KETERANGAN_OPTIONS = ['PM OK', 'Belum Selesai', 'Pending'] as const

function SectionTitle({ title }: { title: string }) {
  return (
    <h4 style={{ margin: '1.25rem 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
      {title}
    </h4>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="wo-detail-row">
      <span className="wo-detail-label">{label}</span>
      <span className="wo-detail-value">{value}</span>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  if (value == null || value === '') return null
  return (
    <div className="wo-detail-row full-width">
      <span className="wo-detail-label">{label}</span>
      <span className="wo-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
    </div>
  )
}

export function ViewPMModal({ pm, onClose, onSuccess }: ViewPMModalProps) {
  const [keteranganStatus, setKeteranganStatus] = useState<typeof KETERANGAN_OPTIONS[number] | ''>(pm.keteranganStatus ?? '')
  const [keteranganNotes, setKeteranganNotes] = useState(pm.keteranganNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setKeteranganStatus(pm.keteranganStatus ?? '')
    setKeteranganNotes(pm.keteranganNotes ?? '')
  }, [pm.id, pm.keteranganStatus, pm.keteranganNotes])

  const showNotesField = keteranganStatus === 'Belum Selesai' || keteranganStatus === 'Pending'

  const handleSaveKeterangan = () => {
    setSaveError('')
    setSaving(true)
    fetch(apiUrl(`/api/dashboard/upcoming-pm/${pm.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keteranganStatus: keteranganStatus || undefined,
        keteranganNotes: showNotesField ? keteranganNotes.trim() || undefined : undefined,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal menyimpan') })
        return r.json()
      })
      .then(() => {
        onSuccess?.()
        onClose()
      })
      .catch((err) => setSaveError(err.message || 'Gagal menyimpan keterangan.'))
      .finally(() => setSaving(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-pm-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2 id="view-pm-title">Detail Schedule PM — {pm.pmId}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* 1. Asset Information */}
          <section className="wo-detail-section">
            <SectionTitle title="1. Asset Information" />
            <div className="wo-detail-grid">
              <DetailRow label="PM ID" value={pm.pmId} />
              <DetailRow label="Asset Name / ID" value={pm.assetName} />
              <DetailRow label="Asset Serial Number" value={pm.assetSerialNumber} />
              <DetailRow label="Asset Location" value={pm.assetLocation} />
            </div>
          </section>

          {/* 2. Preventive Maintenance Type */}
          <section className="wo-detail-section">
            <SectionTitle title="2. Preventive Maintenance Type" />
            <div className="wo-detail-grid">
              <DetailRow label="PM Type" value={pm.pmType} />
              <DetailRow label="PM Category" value={pm.pmCategory} />
              <DetailRow label="Activity / Deskripsi Pekerjaan" value={pm.activity} />
            </div>
          </section>

          {/* 3. Date and Time */}
          <section className="wo-detail-section">
            <SectionTitle title="3. Date and Time" />
            <div className="wo-detail-grid">
              <DetailRow label="Scheduled PM Date" value={pm.scheduledDate} />
              <DetailRow label="PM Frequency" value={pm.frequency} />
              <DetailRow label="Waktu Mulai" value={pm.startTime} />
              <DetailRow label="Waktu Selesai" value={pm.endTime} />
              <DetailRow label="Hari Peringatan" value={pm.warningDays} />
              <DetailRow label="Reminder" value={pm.reminderEnabled === true ? 'Aktif' : pm.reminderEnabled === false ? 'Nonaktif' : null} />
            </div>
          </section>

          {/* 4. Team / Manpower Involved */}
          <section className="wo-detail-section">
            <SectionTitle title="4. Team / Manpower Involved" />
            <div className="wo-detail-grid">
              <DetailRow label="Responsible Technician / Personnel" value={pm.assignedTo} />
              <DetailRow label="Manpower (jumlah orang)" value={pm.manpower} />
              <DetailBlock label="Shift Work Schedule" value={pm.shiftSchedule ?? ''} />
            </div>
          </section>

          {/* 5. Equipment and Spare Parts */}
          <section className="wo-detail-section">
            <SectionTitle title="5. Equipment and Spare Parts" />
            <div className="wo-detail-grid">
              <DetailBlock label="Required Equipment List" value={pm.requiredEquipment ?? ''} />
              <DetailBlock label="Spare Parts List" value={pm.sparePartsList ?? ''} />
            </div>
          </section>

          {/* 6. Keterangan (pengisian: PM OK / Belum Selesai / Pending + notes) */}
          <section className="wo-detail-section">
            <SectionTitle title="6. Keterangan" />
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">Status Keterangan</span>
                <span className="wo-detail-value">
                  <select
                    className="select"
                    value={keteranganStatus}
                    onChange={(e) => setKeteranganStatus(e.target.value as typeof keteranganStatus)}
                    style={{ minWidth: 180, padding: '0.35rem 0.5rem' }}
                  >
                    <option value="">-- Pilih --</option>
                    {KETERANGAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </span>
              </div>
              {showNotesField && (
                <div className="wo-detail-row full-width">
                  <span className="wo-detail-label">Notes</span>
                  <span className="wo-detail-value" style={{ display: 'block', width: '100%' }}>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={keteranganNotes}
                      onChange={(e) => setKeteranganNotes(e.target.value)}
                      placeholder="Isi keterangan / catatan..."
                      style={{ width: '100%', marginTop: '0.25rem' }}
                    />
                  </span>
                </div>
              )}
            </div>
            {saveError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{saveError}</p>
            )}
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveKeterangan}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Keterangan'}
              </button>
            </div>
          </section>

          {/* Instruksi & catatan tambahan (jika ada) */}
          {(pm.detailedInstructions ?? pm.specialNotes ?? pm.priority ?? pm.pmStatus ?? pm.approvalStatus) && (
            <section className="wo-detail-section">
              <SectionTitle title="Lainnya" />
              <div className="wo-detail-grid">
                <DetailBlock label="Detailed Instructions" value={pm.detailedInstructions ?? ''} />
                <DetailBlock label="Special Notes" value={pm.specialNotes ?? ''} />
                <DetailRow label="Priority" value={pm.priority} />
                <DetailRow label="PM Status" value={pm.pmStatus} />
                <DetailRow label="Approval Status" value={pm.approvalStatus} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
