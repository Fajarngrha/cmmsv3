import { useState, useEffect } from 'react'
import { apiUrl } from '../api'

interface SchedulePMModalProps {
  onClose: () => void
  onSuccess: () => void
}

const PM_TYPES = ['Lubrication', 'Routine Inspection', 'Calibration', 'Cleaning', 'Oil Change', 'Safety Check', 'Monthly Inspection', 'Other']
const PM_CATEGORIES = ['Periodic Maintenance', 'Preventive Maintenance', 'System Cleaning', 'Inspection', 'Other']
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Operating Hours']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const PM_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled']
const APPROVAL_STATUSES = ['Pending Approval', 'Approved', 'Rejected', 'Not Required']

function SectionTitle({ title }: { title: string }) {
  return (
    <h4 style={{ margin: '1.25rem 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
      {title}
    </h4>
  )
}

export function SchedulePMModal({ onClose, onSuccess }: SchedulePMModalProps) {
  const [assetName, setAssetName] = useState('')
  const [assetSerialNumber, setAssetSerialNumber] = useState('')
  const [assetLocation, setAssetLocation] = useState('')
  const [pmType, setPmType] = useState('')
  const [pmCategory, setPmCategory] = useState('')
  const [activity, setActivity] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [frequency, setFrequency] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [manpower, setManpower] = useState<number | ''>(1)
  const [shiftSchedule, setShiftSchedule] = useState('')
  const [requiredEquipment, setRequiredEquipment] = useState('')
  const [sparePartsList, setSparePartsList] = useState('')
  const [detailedInstructions, setDetailedInstructions] = useState('')
  const [priority, setPriority] = useState('')
  const [pmStatus, setPmStatus] = useState('Scheduled')
  const [approvalStatus, setApprovalStatus] = useState('Pending Approval')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [warningDays, setWarningDays] = useState<number | ''>(3)
  const [specialNotes, setSpecialNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [assets, setAssets] = useState<{ id: string; assetId: string; name: string; section: string }[]>([])
  useEffect(() => {
    fetch(apiUrl('/api/assets'))
      .then((r) => r.json())
      .then((data) => setAssets(data || []))
      .catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!assetName.trim()) {
      setError('Asset Name wajib diisi.')
      return
    }
    if (!activity.trim()) {
      setError('Activity wajib diisi.')
      return
    }
    if (!scheduledDate) {
      setError('Scheduled PM Date wajib diisi.')
      return
    }
    if (!assignedTo.trim()) {
      setError('Responsible Technician wajib diisi.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl('/api/dashboard/pm-schedule'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetName: assetName.trim(),
        assetSerialNumber: assetSerialNumber.trim() || undefined,
        assetLocation: assetLocation.trim() || undefined,
        pmType: pmType || undefined,
        pmCategory: pmCategory || undefined,
        activity: activity.trim(),
        scheduledDate,
        frequency: frequency || undefined,
        assignedTo: assignedTo.trim(),
        manpower: manpower === '' ? undefined : Number(manpower),
        shiftSchedule: shiftSchedule.trim() || undefined,
        requiredEquipment: requiredEquipment.trim() || undefined,
        sparePartsList: sparePartsList.trim() || undefined,
        detailedInstructions: detailedInstructions.trim() || undefined,
        priority: priority || undefined,
        pmStatus: pmStatus || undefined,
        approvalStatus: approvalStatus || undefined,
        reminderEnabled,
        warningDays: warningDays === '' ? undefined : Number(warningDays),
        specialNotes: specialNotes.trim() || undefined,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Gagal menyimpan') })
        return r.json()
      })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Gagal menyimpan schedule PM.'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-pm-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2 id="schedule-pm-title">Schedule PM — Form Preventive Maintenance</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem 1.25rem' }}>
          {/* 1. Asset Information */}
          <SectionTitle title="1. Asset Information" />
          <div className="form-group">
            <label className="label" htmlFor="assetName">Asset Name / ID *</label>
            <select
              id="assetName"
              className="select"
              value={assets.some((a) => a.name === assetName) ? assetName : ''}
              onChange={(e) => {
                const v = e.target.value
                setAssetName(v)
                const a = assets.find((x) => x.name === v)
                if (a) {
                  setAssetSerialNumber(a.assetId)
                  setAssetLocation(a.section)
                }
              }}
            >
              <option value="">-- Pilih Asset --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.name}>{a.name} ({a.assetId})</option>
              ))}
            </select>
            <input
              type="text"
              className="input"
              style={{ marginTop: '0.5rem' }}
              value={assets.some((a) => a.name === assetName) ? '' : assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Atau ketik nama asset jika tidak ada di daftar"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="assetSerial">Asset Serial Number / ID</label>
            <input id="assetSerial" className="input" value={assetSerialNumber} onChange={(e) => setAssetSerialNumber(e.target.value)} placeholder="e.g. AST-001" />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="assetLocation">Asset Location</label>
            <input id="assetLocation" className="input" value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)} placeholder="e.g. Building A, Line 1" />
          </div>

          {/* 2. Preventive Maintenance Type */}
          <SectionTitle title="2. Preventive Maintenance Type" />
          <div className="form-group">
            <label className="label" htmlFor="pmType">PM Type</label>
            <select id="pmType" className="select" value={pmType} onChange={(e) => setPmType(e.target.value)}>
              <option value="">-- Pilih Tipe --</option>
              {PM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="pmCategory">PM Category</label>
            <select id="pmCategory" className="select" value={pmCategory} onChange={(e) => setPmCategory(e.target.value)}>
              <option value="">-- Pilih Kategori --</option>
              {PM_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="activity">Activity / Deskripsi Pekerjaan *</label>
            <input id="activity" className="input" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. Monthly Inspection, Lubrication" required />
          </div>

          {/* 3. Date and Time */}
          <SectionTitle title="3. Date and Time" />
          <div className="form-group">
            <label className="label" htmlFor="scheduledDate">Scheduled PM Date *</label>
            <input id="scheduledDate" className="input" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="frequency">PM Frequency</label>
            <select id="frequency" className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="">-- Pilih Frekuensi --</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* 4. Team / Manpower */}
          <SectionTitle title="4. Team / Manpower Involved" />
          <div className="form-group">
            <label className="label" htmlFor="assignedTo">Responsible Technician / Personnel *</label>
            <input id="assignedTo" className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Nama teknisi" required />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="manpower">Manpower (jumlah orang)</label>
            <input id="manpower" className="input" type="number" min={1} value={manpower} onChange={(e) => setManpower(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="shiftSchedule">Shift Work Schedule</label>
            <textarea id="shiftSchedule" className="textarea" rows={2} value={shiftSchedule} onChange={(e) => setShiftSchedule(e.target.value)} placeholder="Jadwal shift jika lebih dari satu shift" />
          </div>

          {/* 5. Equipment and Spare Parts */}
          <SectionTitle title="5. Equipment and Spare Parts" />
          <div className="form-group">
            <label className="label" htmlFor="requiredEquipment">Required Equipment List</label>
            <textarea id="requiredEquipment" className="textarea" rows={3} value={requiredEquipment} onChange={(e) => setRequiredEquipment(e.target.value)} placeholder="Alat yang dibutuhkan (satu per baris): kunci, alat kalibrasi, dll." />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="sparePartsList">Spare Parts List</label>
            <textarea id="sparePartsList" className="textarea" rows={3} value={sparePartsList} onChange={(e) => setSparePartsList(e.target.value)} placeholder="Spare part yang dibutuhkan: filter, bearing, belt, dll." />
          </div>

          {/* 6. Instructions */}
          <SectionTitle title="6. Instructions or Work Guidelines" />
          <div className="form-group">
            <label className="label" htmlFor="detailedInstructions">Detailed Instructions</label>
            <textarea id="detailedInstructions" className="textarea" rows={4} value={detailedInstructions} onChange={(e) => setDetailedInstructions(e.target.value)} placeholder="Langkah-langkah pelaksanaan PM" />
          </div>

          {/* 7. Priority */}
          <SectionTitle title="7. Priority" />
          <div className="form-group">
            <label className="label" htmlFor="priority">PM Priority</label>
            <select id="priority" className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">-- Pilih Prioritas --</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 8. PM Status */}
          <SectionTitle title="8. PM Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="pmStatus">PM Status</label>
              <select id="pmStatus" className="select" value={pmStatus} onChange={(e) => setPmStatus(e.target.value)}>
                {PM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="approvalStatus">Approval Status</label>
              <select id="approvalStatus" className="select" value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
                {APPROVAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 9. Notifications and Reminders */}
          <SectionTitle title="9. Notifications and Reminders" />
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="reminderEnabled" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />
            <label className="label" htmlFor="reminderEnabled" style={{ marginBottom: 0 }}>Reminder Notifications (email/WhatsApp)</label>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="warningDays">Warning Date (hari sebelum PM)</label>
            <input id="warningDays" className="input" type="number" min={0} value={warningDays} onChange={(e) => setWarningDays(e.target.value === '' ? '' : Number(e.target.value))} placeholder="3" />
          </div>

          {/* 10. Additional Notes */}
          <SectionTitle title="10. Additional Notes" />
          <div className="form-group">
            <label className="label" htmlFor="specialNotes">Special Notes</label>
            <textarea id="specialNotes" className="textarea" rows={2} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} placeholder="Catatan khusus atau instruksi tambahan" />
          </div>

          {/* 11. Documentation (placeholder) */}
          <SectionTitle title="11. Documentation and Reports" />
          <div className="form-group">
            <label className="label">Photo / Documentation Upload</label>
            <input type="file" className="input" accept="image/*,.pdf" multiple style={{ fontSize: '0.85rem' }} />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Upload foto atau dokumen pendukung (disimpan setelah integrasi storage).</p>
          </div>

          {error && (
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Schedule PM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
