import { useState } from 'react'
import { apiUrl } from '../api'

interface CreatePermintaanPerbaikanModalProps {
  onClose: () => void
  onSuccess: () => void
}

const SECTIONS = ['Molding', 'Die Casting', 'PM Finishing', 'PM Lathe Cam & Boss','Heat Treatment', 
  '3 Set Assy','Machine 1','Machine 2','Press'] as const
const MACHINE_STATUSES = ['Running', 'Stopped', 'Breakdown', 'Under Maintenance']
const OTHER_OPTION_VALUE = '__other__'

const SECTION_MACHINES: Record<string, { names: string[]; brands: string[] }> = {
  Molding: {
    names: ['ZnDC 1','ZnDC 2','ZnDC 3','ZnDC 4','ZnDC 5','ZnDC 6','ZnDC 7','ZnDC 8','ZnDC 9','Main Press','ZnDC 150T', 'Seikei 1',
      'Seikei 2','Seikei 3','Seikei 4','Seikei 5','Seikei 6','Seikei 7','Seikei 8','Seikei 9','Seikei 10','Seikei 11','Seikei 12','Seikei 13',
      'Seikei 14','Seikei 15','Seikei 16','Seikei 17','Seikei 18','Seikei 19','Seikei 20','Seikei 21','Seikei 22','Seikei 23','Seikei 24','Seikei 25',
      'Seikei 26','Seikei 27','Seikei 28','Seikei 29','Seikei 30','Seikei 31','Seikei 32','Seikei 33','Seikei 34','Seikei 35','Seikei 36','Seikei 37','Seikei 38',
      'Seikei 39','Seikei 40','Seikei 41','Seikei 42','Kikis 7', 'Kikis 1B','Kikis 6B','Kikis 9','Kikis 8','Kikis 4','Kikis 2FE','Kikis 5B','Segment 2', 'Segment 4', 'Caulking 1','Caulking 2',
      'Caulking 3','Caulking 4',
    ],
    brands: ['Siemens', 'ABB', 'Mitsubishi', 'Engel', 'Husky'],
  },
  'Die Casting': {
    names: ['350T 1 (DC1)', '350T 2 (DC2)', '350T 3 (DC5)', '350T 4 (DC6)', '350T 5 (DC7)', '350T 6 (DC8))','350T 7 (DC10)','350T 8 (DC11)'
      ,'350 T TOYO 1','350 T TOYO 2','350 T TOYO 3','350 T TOYO 4','250T 3 (DC9)','250T 2(DC4)','500 T TOYO 5','Shotblast 1','Shotblast 2',
      'Shotblast 3', 'COMPRESSOR 5','COMPRESSOR 7','COMPRESSOR 8'
    ],
    brands: ['Siemens', 'ABB', 'Bühler', 'Toshiba', 'Toyo'],
  },
  'PM Finishing': {
    names: ['AT 1', 'AT 3', 'AT 5', 'AT 6', 'AT 10','AT 19','AT 20','AT 23','AT 25','AT 26','AT 27','AT 28','AT 29','AT 34','AT 35'
      ,'AT 36','AT 37','AT 38','AT 38R','AT 39','AT 42','AT 43','AT 44','AT 45','AT 46','AT 49','AT 50','AT 51','AT 52','AT 53','AT 58','AT 65',
    'AT 68','AT 69','Ringmash 1','Ringmash 2','Ringmash 3','Ringmash 5','Ringmash 7','Ringmash 6','Ringmash 8','Plasma 1','Plasma 8'
    ,'NC 1','NC 10','NC 22','NC 23','NC 24','NC 27','NC 28','NC 29','NC 30','NC 32','Tapping 1','Tapping 2','Tapping 3','Insert Bearing Manual 1','Insert Bearing Manual 2'],
    brands: ['ABB', 'Siemens', 'Muratec', 'Gates', 'Browning'],
  },
  'PM Lathe Cam & Boss': {
    names: ['AT 2', 'AT 31', 'AT 21', 'AT 22', 'AT 47','AT 54R','AT 54L','AT 67R','AT 67L','AT 9R','AT 9L','AT 18R','AT 18L','AT 59R',
      'AT 59L','AT 24R','AT 24L','AT 30L','AT 30R','AT 23R','AT 23L','AT 56R','AT 56L','AT 60R','AT 60L','AT 33','AT 55','AT 64','AT 66','AT 32',
      'NC 2','NC 11','NC 12','NC 13','NC 14','NC 15','NC 16','NC 17','NC 18','NC 19','NC 20','NC 21','NC 25','NC 26','NC 33','NC 34','NC 4','NC 5','NC 6','NC 7','NC 8','NC 9','NC A2','NC D1',
      'Tapping 1','Tapping 2','Tapping 3','Tapping 6','Tapping 6','Grinding 1','Grinding 2','Grinding 11','Grinding 12','Washing 1','Washing 2','MC 1','MC 2','MC 5','MC 6','MC 7','MC 8','MC 9','MC 10',
      'MC 11','MC 12','MC 13','MC 14','MC 15','MC 16','MC 17','MC 18','MC 19','MC 22','MILLING 2','MILLING 7','MILLING 8','MILLING 9'],
    brands: ['ABB', 'Siemens', 'Muratec', 'Gates', 'Browning'],
  },
  'Heat Treatment': {
    names: ['Dowa 8', 'Dowa 9', 'Dowa 10', 'Oriental 1', 'Oriental 2','Oriental 3','Oriental 4','Oriental 5','Oriental 6',
      'Oriental 7','CCI 1','CCI 2','CCI 3','CCI 4','CCI 5','PPC 1','PPC 1'],
    brands: ['Dowa', 'Oriental'],
  },
  '3 Set Assy': {
    names: ['Line CA', 'Line DP', 'Line PO', 'Line 1 Prim A', 'Line 2 Prim A','AT 10R','AT 10L','AT 11R','AT 11L','AT 5RL','AT 7RL'
      ,'AT 3','AT 4','NC 1','NC 37','NC 39','NC 38','NC 40','NC 2','NC 17','NC 29','NC 4','NC 13','AT Burnishing 1','AT Burnishing 2'
      ,'AT Burnishing 3','AT Burnishing 4','Burnishing Manual 1','Burnishing Manual 2','Air Press 1','Air Press 2','NC 35','NC 20','NC 14','Caulking 1'
      ,'Caulking 2','Caulking 3','Caulking 4','M/C Hot Press','AT5'],
    brands: ['ABB', 'Siemens', 'Fenner', 'Gates', 'Browning'],
  },
  'Machine 1': {
    names: ['Pulley Machine 1', 'Pulley Machine 2', 'Pulley Assembly Line', 'Pulley Assy A', 'Pulley Assy B'],
    brands: ['ABB', 'Siemens', 'Fenner', 'Gates', 'Browning'],
  },
  'Machine 2': {
    names: ['Pulley Machine 1', 'Pulley Machine 2', 'Pulley Assembly Line', 'Pulley Assy A', 'Pulley Assy B'],
    brands: ['ABB', 'Siemens', 'Fenner', 'Gates', 'Browning'],
  },
  'Press': {
    names: ['Pulley Machine 1', 'Pulley Machine 2', 'Pulley Assembly Line', 'Pulley Assy A', 'Pulley Assy B'],
    brands: ['ABB', 'Siemens', 'Fenner', 'Gates', 'Browning'],
  },
}

export function CreatePermintaanPerbaikanModal({ onClose, onSuccess }: CreatePermintaanPerbaikanModalProps) {
  const [section, setSection] = useState('')
  const [machineName, setMachineName] = useState('')
  const [machineBrand, setMachineBrand] = useState('')
  const [machineStatus, setMachineStatus] = useState('')
  const [sectionOther, setSectionOther] = useState('')
  const [machineNameOther, setMachineNameOther] = useState('')
  const [machineBrandOther, setMachineBrandOther] = useState('')
  const [machineStatusOther, setMachineStatusOther] = useState('')
  const [damageDescription, setDamageDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sectionOptions = SECTION_MACHINES[section]
  const machineNames = sectionOptions?.names ?? []
  const machineBrands = sectionOptions?.brands ?? []

  const handleSectionChange = (newSection: string) => {
    setSection(newSection)
    if (newSection !== OTHER_OPTION_VALUE) setSectionOther('')
    setMachineName('')
    setMachineBrand('')
    setMachineNameOther('')
    setMachineBrandOther('')
  }

  const effectiveSection = section === OTHER_OPTION_VALUE ? sectionOther.trim() : section
  const effectiveMachineName = machineName === OTHER_OPTION_VALUE ? machineNameOther.trim() : machineName
  const effectiveMachineBrand = machineBrand === OTHER_OPTION_VALUE ? machineBrandOther.trim() : machineBrand
  const effectiveMachineStatus = machineStatus === OTHER_OPTION_VALUE ? machineStatusOther.trim() : machineStatus

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!effectiveSection) {
      setError('Section wajib diisi.')
      return
    }
    if (section === OTHER_OPTION_VALUE && !sectionOther.trim()) {
      setError('Isi Section (lainnya).')
      return
    }
    if (!effectiveMachineName) {
      setError('Nama mesin wajib diisi.')
      return
    }
    if (machineName === OTHER_OPTION_VALUE && !machineNameOther.trim()) {
      setError('Isi Nama Mesin (lainnya).')
      return
    }
    if (!effectiveMachineStatus) {
      setError('Status mesin wajib diisi.')
      return
    }
    if (machineStatus === OTHER_OPTION_VALUE && !machineStatusOther.trim()) {
      setError('Isi Status Mesin (lainnya).')
      return
    }
    if (!damageDescription.trim()) {
      setError('Deskripsi kerusakan wajib diisi.')
      return
    }
    setSubmitting(true)
    fetch(apiUrl('/api/permintaan-perbaikan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineName: effectiveMachineName,
        machineBrand: effectiveMachineBrand || undefined,
        section: effectiveSection,
        machineStatus: effectiveMachineStatus,
        damageDescription: damageDescription.trim(),
        reportedBy: 'Tim Produksi',
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Gagal membuat permintaan perbaikan')
        return r.json()
      })
      .then(() => onSuccess())
      .catch(() => setError('Gagal membuat permintaan perbaikan. Silakan coba lagi.'))
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
      aria-labelledby="create-pp-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="create-pp-title">Buat Permintaan perbaikan - Tim Produksi</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="modal-info">
          <strong>Informasi:</strong> No. Registrasi (Req) dan waktu dicatat otomatis saat form dikirim.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="woNo">No. Registrasi (Req)</label>
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
            <label className="label" htmlFor="time">Waktu</label>
            <input
              id="time"
              className="input"
              type="text"
              readOnly
              disabled
              value={`Dicatat saat submit (contoh: ${submissionTime})`}
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
              <option value="">-- Pilih Section --</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={OTHER_OPTION_VALUE}>Lainnya (Other)</option>
            </select>
            {section === OTHER_OPTION_VALUE && (
              <input
                type="text"
                className="input"
                placeholder="Ketik Section (free text)"
                value={sectionOther}
                onChange={(e) => setSectionOther(e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="machine">Nama Mesin *</label>
            <select
              id="machine"
              className="select"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              disabled={!section && section !== OTHER_OPTION_VALUE}
            >
              <option value="">{section ? '-- Pilih Nama Mesin --' : '-- Pilih Section dulu --'}</option>
              {machineNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value={OTHER_OPTION_VALUE}>Lainnya (Other)</option>
            </select>
            {machineName === OTHER_OPTION_VALUE && (
              <input
                type="text"
                className="input"
                placeholder="Ketik Nama Mesin (free text)"
                value={machineNameOther}
                onChange={(e) => setMachineNameOther(e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="brand">Merk Mesin</label>
            <select
              id="brand"
              className="select"
              value={machineBrand}
              onChange={(e) => setMachineBrand(e.target.value)}
              disabled={!section && section !== OTHER_OPTION_VALUE}
            >
              <option value="">{section ? '-- Pilih Merk Mesin --' : '-- Pilih Section dulu --'}</option>
              {machineBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
              <option value={OTHER_OPTION_VALUE}>Lainnya (Other)</option>
            </select>
            {machineBrand === OTHER_OPTION_VALUE && (
              <input
                type="text"
                className="input"
                placeholder="Ketik Merk Mesin (free text)"
                value={machineBrandOther}
                onChange={(e) => setMachineBrandOther(e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="machineStatus">Status Mesin *</label>
            <select
              id="machineStatus"
              className="select"
              value={machineStatus}
              onChange={(e) => setMachineStatus(e.target.value)}
            >
              <option value="">-- Pilih Status Mesin --</option>
              {MACHINE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={OTHER_OPTION_VALUE}>Lainnya (Other)</option>
            </select>
            {machineStatus === OTHER_OPTION_VALUE && (
              <input
                type="text"
                className="input"
                placeholder="Ketik Status Mesin (free text)"
                value={machineStatusOther}
                onChange={(e) => setMachineStatusOther(e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="desc">Deskripsi Kerusakan *</label>
            <textarea
              id="desc"
              className="textarea"
              placeholder="Jelaskan kerusakan, kapan mulai, apakah mesin masih bisa jalan, dan tanda-tanda (suara, bau, dll.)"
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              rows={5}
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Berikan detail sebanyak mungkin agar proses perbaikan lebih cepat.
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
              {submitting ? 'Mengirim...' : 'Kirim Permintaan perbaikan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
