import { useState } from 'react'
import { apiUrl } from '../api'

interface CreateWorkOrderModalProps {
  onClose: () => void
  onSuccess: () => void
}

const SECTIONS = ['Molding', 'Die Casting', 'Pulley Machine'] as const
const MACHINE_STATUSES = ['Running', 'Stopped', 'Breakdown', 'Under Maintenance']

/** Pilihan Machine Name dan Machine Brand per Section */
const SECTION_MACHINES: Record<string, { names: string[]; brands: string[] }> = {
  Molding: {
    names: ['Injection Molding 1', 'Injection Molding 2', 'Compressor Unit Molding', 'Molding Press A', 'Molding Press B'],
    brands: ['Siemens', 'ABB', 'Mitsubishi', 'Engel', 'Husky'],
  },
  'Die Casting': {
    names: ['Die Casting 1', 'Die Casting 2', 'Cold Chamber Die Casting', 'Hot Chamber Die Casting'],
    brands: ['Siemens', 'ABB', 'Bühler', 'Toshiba', 'L.K. Group'],
  },
  'Pulley Machine': {
    names: ['Pulley Machine 1', 'Pulley Machine 2', 'Pulley Assembly Line', 'Pulley Assy A', 'Pulley Assy B'],
    brands: ['ABB', 'Siemens', 'Fenner', 'Gates', 'Browning'],
  },
}

export function CreateWorkOrderModal({ onClose, onSuccess }: CreateWorkOrderModalProps) {
  const [section, setSection] = useState('')
  const [machineName, setMachineName] = useState('')
  const [machineBrand, setMachineBrand] = useState('')
  const [machineStatus, setMachineStatus] = useState('')
  const [damageDescription, setDamageDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sectionOptions = SECTION_MACHINES[section]
  const machineNames = sectionOptions?.names ?? []
  const machineBrands = sectionOptions?.brands ?? []

  const handleSectionChange = (newSection: string) => {
    setSection(newSection)
    setMachineName('')
    setMachineBrand('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!machineName.trim()) {
      setError('Machine Name is required.')
      return
    }
    if (!section) {
      setError('Section is required.')
      return
    }
    if (!machineStatus) {
      setError('Machine Status is required.')
      return
    }
    if (!damageDescription.trim()) {
      setError('Damage Description is required.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl('/api/work-orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineName: machineName.trim(),
        machineBrand: machineBrand.trim() || undefined,
        section,
        machineStatus,
        damageDescription: damageDescription.trim(),
        reportedBy: 'Tim Produksi',
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to create work order')
        return r.json()
      })
      .then(() => onSuccess())
      .catch(() => setError('Failed to create work order. Please try again.'))
      .finally(() => setSubmitting(false))
  }

  const submissionTime = new Date().toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-wo-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="create-wo-title">Create Work Order - Tim Produksi</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-info">
          <strong>Informasi:</strong> Work Order No. and Time are auto-generated and recorded when you submit this form.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="woNo">Work Order No.</label>
            <input
              id="woNo"
              className="input"
              type="text"
              readOnly
              disabled
              value="Auto-generated on submit"
              style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="time">Time</label>
            <input
              id="time"
              className="input"
              type="text"
              readOnly
              disabled
              value={`Recorded at submission (e.g. ${submissionTime})`}
              style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="section">Section *</label>
            <select
              id="section"
              className="select"
              value={section}
              onChange={(e) => handleSectionChange(e.target.value)}
            >
              <option value="">-- Select Section --</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="machine">Machine Name *</label>
            <select
              id="machine"
              className="select"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              disabled={!section}
            >
              <option value="">{section ? '-- Select Machine Name --' : '-- Pilih Section dulu --'}</option>
              {machineNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="brand">Machine Brand</label>
            <select
              id="brand"
              className="select"
              value={machineBrand}
              onChange={(e) => setMachineBrand(e.target.value)}
              disabled={!section}
            >
              <option value="">{section ? '-- Select Machine Brand --' : '-- Pilih Section dulu --'}</option>
              {machineBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="machineStatus">Machine Status *</label>
            <select
              id="machineStatus"
              className="select"
              value={machineStatus}
              onChange={(e) => setMachineStatus(e.target.value)}
            >
              <option value="">-- Select Machine Status --</option>
              {MACHINE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="desc">Damage Description *</label>
            <textarea
              id="desc"
              className="textarea"
              placeholder="Describe the damage, when it started, whether the machine can still operate, and any signs (noise, smell, etc.)"
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              rows={5}
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Provide as much detail as possible to speed up the repair process.
            </p>
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
              {submitting ? 'Submitting...' : 'Submit Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
