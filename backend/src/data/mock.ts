export type WOStatus = 'PM' | 'Open' | 'Pending' | 'In Progress' | 'Completed'
export type AssetHealth = 'Running' | 'Warning' | 'Breakdown'

export interface WorkOrder {
  id: string
  woId: string
  machineName: string
  machineBrand?: string
  section: string
  machineStatus?: string
  damageType: string
  status: WOStatus
  dueDate: string
  reportedBy: string
  technician?: string
  assigned?: string
  createdAt: string
  type?: 'Corrective' | 'PM' | 'Inspection'
  /** Set when status changes to In Progress */
  startedAt?: string
  /** Set when status changes to Completed */
  closedAt?: string
  causeOfDamage?: string
  repairsPerformed?: string
  actionType?: string
  replacedSpareParts?: string
  replacedPartsSpec?: string
  replacedPartsQty?: number
  totalDowntimeHours?: number
  /** Alasan WO ditunda (status Pending) */
  pendingReason?: string
  /** Tanggal jadwal PM (status PM), masuk ke schedule preventive maintenance */
  pmScheduledDate?: string
}

export interface DashboardKpis {
  pmCompliance: number
  totalDowntimeHours: number
  maintenanceCostIdr: number
  breakdownCount: number
  openWorkOrders: number
  overdueCount: number
  workOrdersDueToday: number
  assetsInMaintenance: number
  pmComplianceRate: number
}

export interface MaintenanceTrendMonth {
  month: string
  reactiveWOs: number
  preventiveWOs: number
}

export interface ParetoCause {
  cause: string
  hours: number
  cumulativePercent: number
}

export interface UpcomingPM {
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
  /** Keterangan hasil: PM OK | Belum Selesai | Pending */
  keteranganStatus?: 'PM OK' | 'Belum Selesai' | 'Pending'
  /** Catatan jika Belum Selesai atau Pending */
  keteranganNotes?: string
}

export interface QuickStats {
  avgResponseTimeHours: number
  completedWOs: number
  techniciansActive: number
  equipmentUptimePercent: number
  warningCount: number
}

export interface WOStatusDistribution {
  completed: number
  inProgress: number
  pending: number
  open: number
}

export interface AssetHealthCounts {
  running: number
  warning: number
  breakdown: number
}

const workOrders: WorkOrder[] = [
  { id: '1', woId: 'WO1032', machineName: '350T 4', machineBrand: 'Toshiba', section: 'Die Casting', machineStatus: 'Running', damageType: 'Preventive maintenance scheduled', status: 'PM', dueDate: '2026-04-24', reportedBy: 'Maintenance', technician: 'Sehat', assigned: 'Agso', createdAt: '2026-04-20T08:00:00', type: 'PM' },
  { id: '2', woId: 'WO1048', machineName: '350T 4', machineBrand: 'Toshiba', section: 'Die Casting', machineStatus: 'Stopped', damageType: 'Mechanical wear on belt; unusual noise when running', status: 'Open', dueDate: '2026-04-20', reportedBy: 'Tim Produksi', technician: 'Agus', assigned: 'Budi', createdAt: '2026-04-18T10:00:00', type: 'Corrective' },
  { id: '3', woId: 'WO1051', machineName: 'Hydraulic Pump #2', machineBrand: 'ABB', section: 'Line 3', machineStatus: 'Breakdown', damageType: 'Leak detected at seal; oil pool under unit', status: 'Pending', dueDate: '2026-04-27', reportedBy: 'Maintenance', technician: 'Budi', assigned: 'Wiharyi', createdAt: '2026-04-22T09:00:00', type: 'Corrective' },
  { id: '4', woId: 'WO1056', machineName: 'Boiler #1', machineBrand: 'Mitsubishi', section: 'Line 1', machineStatus: 'Under Maintenance', damageType: 'Pressure fluctuation; gauge reading inconsistent', status: 'Open', dueDate: '2026-04-22', reportedBy: 'Tim Produksi', technician: 'Rian', assigned: 'Riarp', createdAt: '2026-04-21T14:00:00', type: 'Corrective' },
  { id: '5', woId: 'WO1042', machineName: 'Motor Listrik 3 Phase', machineBrand: 'Siemens', section: 'Line 2', machineStatus: 'Breakdown', damageType: 'Electrical; motor trips after 10 min run; burning smell', status: 'In Progress', dueDate: '2026-04-25', reportedBy: 'Maintenance', technician: 'Ahmad', assigned: 'Agso', createdAt: '2026-04-23T08:00:00', startedAt: '2026-04-24T09:00:00', type: 'Corrective' },
  { id: '6', woId: 'WO1065', machineName: 'Chiller System', machineBrand: 'Carrier', section: 'Line 3', machineStatus: 'Running', damageType: 'Cooling capacity drop; outlet temp rising', status: 'Pending', dueDate: '2026-04-28', reportedBy: 'Tim Produksi', technician: 'Dedi', assigned: 'Budi', createdAt: '2026-04-24T11:00:00', type: 'Corrective' },
  // Completed WO untuk data riwayat perbaikan / PM (dipakai di View Asset)
  { id: '7', woId: 'WO1020', machineName: '350T 4', machineBrand: 'Toshiba', section: 'Die Casting', machineStatus: 'Running', damageType: 'PM rutin; ganti filter dan oli', status: 'Completed', dueDate: '2026-04-01', reportedBy: 'Maintenance', technician: 'Sehat', createdAt: '2026-04-01T07:00:00', closedAt: '2026-04-01T11:30:00', type: 'PM', causeOfDamage: 'Scheduled PM', repairsPerformed: 'Ganti filter udara, ganti oli kompresor', actionType: 'Replace', replacedSpareParts: 'Air Filter 10", Hydraulic Oil ISO 46', replacedPartsSpec: 'Filter 10 inch; Oil 5L', replacedPartsQty: 2, totalDowntimeHours: 4.5 },
  { id: '8', woId: 'WO1015', machineName: '350T 4', machineBrand: 'Toshiba', section: 'Die Casting', machineStatus: 'Running', damageType: 'Bearing aus; suara tidak normal', status: 'Completed', dueDate: '2026-03-10', reportedBy: 'Tim Produksi', technician: 'Agus', createdAt: '2026-03-10T08:00:00', closedAt: '2026-03-10T14:00:00', type: 'Corrective', causeOfDamage: 'Bearing rusak akibat keausan', repairsPerformed: 'Ganti ball bearing 6205', actionType: 'Replace', replacedSpareParts: 'Ball Bearing 6205', replacedPartsSpec: 'SKF 6205-2RS', replacedPartsQty: 1, totalDowntimeHours: 6 },
  { id: '9', woId: 'WO1018', machineName: 'Conveyor Belt A', machineBrand: 'Siemens', section: 'Line 2', machineStatus: 'Running', damageType: 'V-belt slip; conveyor lambat', status: 'Completed', dueDate: '2026-03-20', reportedBy: 'Tim Produksi', technician: 'Budi', createdAt: '2026-03-20T09:00:00', closedAt: '2026-03-20T12:00:00', type: 'Corrective', causeOfDamage: 'V-belt aus', repairsPerformed: 'Ganti V-belt', actionType: 'Replace', replacedSpareParts: 'V-Belt A42', replacedPartsSpec: 'A42', replacedPartsQty: 1, totalDowntimeHours: 3 },
]

const dashboardKpis: DashboardKpis = {
  pmCompliance: 92,
  totalDowntimeHours: 15.5,
  maintenanceCostIdr: 32_500_000,
  breakdownCount: 12,
  openWorkOrders: 48,
  overdueCount: 8,
  workOrdersDueToday: 12,
  assetsInMaintenance: 6,
  pmComplianceRate: 92,
}

const maintenanceTrend: MaintenanceTrendMonth[] = [
  { month: 'Jan', reactiveWOs: 18, preventiveWOs: 22 },
  { month: 'Feb', reactiveWOs: 28, preventiveWOs: 25 },
  { month: 'Mar', reactiveWOs: 15, preventiveWOs: 30 },
  { month: 'Apr', reactiveWOs: 22, preventiveWOs: 35 },
  { month: 'May', reactiveWOs: 32, preventiveWOs: 38 },
  { month: 'Jun', reactiveWOs: 20, preventiveWOs: 36 },
]

const paretoDowntime: ParetoCause[] = [
  { cause: 'Bearings', hours: 11, cumulativePercent: 45 },
  { cause: 'Belts', hours: 5, cumulativePercent: 65 },
  { cause: 'Sensor', hours: 4, cumulativePercent: 82 },
  { cause: 'Filter', hours: 3, cumulativePercent: 92 },
  { cause: 'More...', hours: 2, cumulativePercent: 100 },
]

const upcomingPM: UpcomingPM[] = [
  { id: '1', pmId: 'PM2401', assetName: 'Air Compressor #1', activity: 'Monthly Inspection', scheduledDate: '2026-04-25', assignedTo: 'Sehat' },
  { id: '2', pmId: 'PM2402', assetName: 'Conveyor Belt #3', activity: 'Lubrication', scheduledDate: '2026-04-26', assignedTo: 'Agus' },
  { id: '3', pmId: 'PM2403', assetName: 'Hydraulic Pump #2', activity: 'Oil Change', scheduledDate: '2026-04-27', assignedTo: 'Budi' },
  { id: '4', pmId: 'PM2404', assetName: 'Boiler #1', activity: 'Safety Check', scheduledDate: '2026-04-28', assignedTo: 'Rian' },
  { id: '5', pmId: 'PM2405', assetName: 'Cooling Tower', activity: 'Cleaning & Inspection', scheduledDate: '2026-04-29', assignedTo: 'Ahmad' },
]

const quickStats: QuickStats = {
  avgResponseTimeHours: 2.5,
  completedWOs: 156,
  techniciansActive: 8,
  equipmentUptimePercent: 94.2,
  warningCount: 4,
}

const woStatusDistribution: WOStatusDistribution = {
  completed: 30,
  inProgress: 35,
  pending: 15,
  open: 20,
}

const assetHealthCounts: AssetHealthCounts = {
  running: 18,
  warning: 4,
  breakdown: 2,
}

export interface Asset {
  id: string
  assetId: string
  name: string
  section: string
  health: AssetHealth
  lastPmDate: string
  nextPmDate: string
  uptimePercent: number
  /** Tanggal instalasi mesin (untuk hitung usia mesin) */
  installedAt?: string
}

export interface SparePart {
  id: string
  partCode: string
  name: string
  category: string
  stock: number
  minStock: number
  unit: string
  location: string
  /** Spesifikasi part */
  spec?: string
  /** Untuk mesin (nama mesin yang menggunakan part ini) */
  forMachine?: string
}

/** Riwayat transaksi spare part masuk/keluar untuk audit */
export interface SparePartMovement {
  id: string
  partId: string
  partCode: string
  partName: string
  type: 'in' | 'out'
  qty: number
  unit: string
  reason?: string
  pic?: string
  createdAt: string
}

export type POKategori = 'Preventive' | 'Sparepart' | 'Breakdown/Repair'
export type POStatus = 'Tahap 1' | 'Tahap 2' | 'Tahap 3' | 'Tahap 4' | 'Tahap 5' | 'Tahap 6' | 'Tahap 7'

export interface PurchaseOrder {
  id: string
  tanggal: string
  itemDeskripsi: string
  model: string
  hargaPerUnit: number
  qty: number
  noRegistrasi: string
  noPO: string
  mesin: string
  noQuotation: string
  supplier: string
  kategori: POKategori
  totalHarga: number
  status: POStatus
}

const assets: Asset[] = [
  { id: '1', assetId: 'AST-001', name: '350T 4', section: 'Die Casting', health: 'Running', lastPmDate: '2025-04-01', nextPmDate: '2026-05-01', uptimePercent: 98.5 },
  { id: '2', assetId: 'AST-002', name: 'Conveyor Belt A', section: 'Line 2', health: 'Warning', lastPmDate: '2026-03-15', nextPmDate: '2026-04-25', uptimePercent: 92 },
  { id: '3', assetId: 'AST-003', name: 'Hydraulic Pump #2', section: 'Line 3', health: 'Running', lastPmDate: '2026-04-10', nextPmDate: '2026-05-10', uptimePercent: 96 },
  { id: '4', assetId: 'AST-004', name: 'Boiler #1', section: 'Line 1', health: 'Warning', lastPmDate: '2026-03-20', nextPmDate: '2026-04-28', uptimePercent: 88 },
  { id: '5', assetId: 'AST-005', name: 'Motor Listrik 3 Phase', section: 'Line 2', health: 'Running', lastPmDate: '2026-04-05', nextPmDate: '2026-05-05', uptimePercent: 99 },
  { id: '6', assetId: 'AST-006', name: 'Chiller System', section: 'Line 3', health: 'Running', lastPmDate: '2026-04-12', nextPmDate: '2026-05-12', uptimePercent: 97 },
  { id: '7', assetId: 'AST-007', name: 'Cooling Tower', section: 'Line 1', health: 'Breakdown', lastPmDate: '2026-02-28', nextPmDate: '2026-04-29', uptimePercent: 72 },
  { id: '8', assetId: 'AST-008', name: 'Air Compressor #2', section: 'Line 2', health: 'Warning', lastPmDate: '2026-03-28', nextPmDate: '2026-04-26', uptimePercent: 85 },
]

const purchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    tanggal: '2026-04-15',
    itemDeskripsi: 'Ball Bearing 6205',
    model: 'SKF 6205-2RS',
    hargaPerUnit: 85000,
    qty: 10,
    noRegistrasi: 'MTC/SPB/04/24/0001',
    noPO: 'PO-2026-001',
    mesin: 'Conveyor Belt A',
    noQuotation: 'QUO-2026-015',
    supplier: 'PT Teknik Jaya',
    kategori: 'Sparepart',
    totalHarga: 850000,
    status: 'Tahap 3',
  },
  {
    id: '2',
    tanggal: '2026-04-18',
    itemDeskripsi: 'Hydraulic Oil ISO 46',
    model: 'Shell Tellus 46',
    hargaPerUnit: 125000,
    qty: 4,
    noRegistrasi: 'MTC/SPB/04/24/0002',
    noPO: 'PO-2026-002',
    mesin: 'Hydraulic Pump #2',
    noQuotation: 'QUO-2026-018',
    supplier: 'PT Sumber Lubrikasi',
    kategori: 'Preventive',
    totalHarga: 500000,
    status: 'Tahap 2',
  },
]

const spareParts: SparePart[] = [
  { id: '1', partCode: 'FLT-001', name: 'Air Filter 10"', category: 'Filters', stock: 45, minStock: 20, unit: 'pcs', location: 'A1-01', spec: '10 inch', forMachine: 'Compressor Unit 1' },
  { id: '2', partCode: 'BRG-001', name: 'Ball Bearing 6205', category: 'Bearings', stock: 28, minStock: 15, unit: 'pcs', location: 'B2-03', spec: 'SKF 6205-2RS', forMachine: 'Conveyor Belt A' },
  { id: '3', partCode: 'BLT-001', name: 'V-Belt A42', category: 'Belts', stock: 12, minStock: 10, unit: 'pcs', location: 'A1-05', spec: 'A42', forMachine: 'Conveyor Belt A' },
  { id: '4', partCode: 'LUB-001', name: 'Hydraulic Oil ISO 46', category: 'Lubricants', stock: 80, minStock: 30, unit: 'L', location: 'C1-02', spec: '5L drum', forMachine: 'Hydraulic Pump #2' },
  { id: '5', partCode: 'SNR-001', name: 'Proximity Sensor', category: 'Sensors', stock: 8, minStock: 5, unit: 'pcs', location: 'B1-04', spec: '24VDC NPN', forMachine: 'Motor Listrik 3 Phase' },
  { id: '6', partCode: 'FLT-002', name: 'Oil Filter', category: 'Filters', stock: 18, minStock: 12, unit: 'pcs', location: 'A1-01', spec: 'Spin-on', forMachine: 'Boiler #1' },
  { id: '7', partCode: 'BRG-002', name: 'Spherical Bearing', category: 'Bearings', stock: 5, minStock: 8, unit: 'pcs', location: 'B2-03', spec: 'Self-aligning', forMachine: 'Chiller System' },
  { id: '8', partCode: 'BLT-002', name: 'Timing Belt', category: 'Belts', stock: 6, minStock: 5, unit: 'pcs', location: 'A1-05', spec: 'HTD 5M', forMachine: 'Air Compressor #2' },
]

const sparePartHistory: SparePartMovement[] = []

export const mock = {
  workOrders,
  dashboardKpis,
  maintenanceTrend,
  paretoDowntime,
  upcomingPM,
  quickStats,
  woStatusDistribution,
  assetHealthCounts,
  assets,
  spareParts,
  sparePartHistory,
  purchaseOrders,
}
