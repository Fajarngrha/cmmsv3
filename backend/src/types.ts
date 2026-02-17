/** Shared types for API responses (camelCase). DB columns are snake_case. */

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
  startedAt?: string
  closedAt?: string
  causeOfDamage?: string
  repairsPerformed?: string
  actionType?: string
  replacedSpareParts?: string
  replacedPartsSpec?: string
  replacedPartsQty?: number
  totalDowntimeHours?: number
  pendingReason?: string
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
  keteranganStatus?: 'PM OK' | 'Belum Selesai' | 'Pending'
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

export interface Asset {
  id: string
  assetId: string
  name: string
  section: string
  health: AssetHealth
  lastPmDate: string
  nextPmDate: string
  uptimePercent: number
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
  spec?: string
  forMachine?: string
}

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
