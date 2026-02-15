import { Router } from 'express'
import { mock } from '../data/mock.js'

export const dashboardRouter = Router()

dashboardRouter.get('/dashboard/kpis', (_, res) => {
  // Hitung maintenanceCostIdr dari total harga semua Purchase Orders
  const totalMaintenanceCost = mock.purchaseOrders.reduce(
    (sum, po) => sum + (typeof po.totalHarga === 'number' ? po.totalHarga : 0),
    0
  )

  // Hitung PM Compliance dari jadwal: kepatuhan = % jadwal PM yang statusnya "PM OK" (selesai sesuai)
  const allPM = mock.upcomingPM
  const totalPM = allPM.length
  const compliantCount = allPM.filter((p) => p.keteranganStatus === 'PM OK').length
  const pmCompliance = totalPM > 0 ? Math.round((compliantCount / totalPM) * 100) : 100
  const pmComplianceRate = pmCompliance

  res.json({
    ...mock.dashboardKpis,
    maintenanceCostIdr: totalMaintenanceCost,
    pmCompliance,
    pmComplianceRate,
  })
})

dashboardRouter.get('/dashboard/trend', (_, res) => {
  res.json(mock.maintenanceTrend)
})

dashboardRouter.get('/dashboard/pareto', (_, res) => {
  res.json(mock.paretoDowntime)
})

dashboardRouter.get('/dashboard/upcoming-pm', (_, res) => {
  res.json(mock.upcomingPM)
})

dashboardRouter.patch('/dashboard/upcoming-pm/:id', (req, res) => {
  const idx = mock.upcomingPM.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Jadwal PM tidak ditemukan.' })
  const body = req.body as Record<string, unknown>
  const pm = mock.upcomingPM[idx]
  if (body.keteranganStatus !== undefined) {
    const v = String(body.keteranganStatus).trim()
    if (v === 'PM OK' || v === 'Belum Selesai' || v === 'Pending') pm.keteranganStatus = v
  }
  if (body.keteranganNotes !== undefined) pm.keteranganNotes = String(body.keteranganNotes).trim() || undefined
  res.json(pm)
})

dashboardRouter.delete('/dashboard/upcoming-pm/:id', (req, res) => {
  const idx = mock.upcomingPM.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Jadwal PM tidak ditemukan.' })
  mock.upcomingPM.splice(idx, 1)
  res.status(204).send()
})

dashboardRouter.post('/dashboard/pm-schedule', (req, res) => {
  const body = req.body as Record<string, unknown>
  const assetName = String(body.assetName ?? '').trim()
  const activity = String(body.activity ?? '').trim()
  const scheduledDate = String(body.scheduledDate ?? '').trim()
  const assignedTo = String(body.assignedTo ?? '').trim()
  if (!assetName) return res.status(400).json({ error: 'Asset Name wajib diisi.' })
  if (!activity) return res.status(400).json({ error: 'Activity wajib diisi.' })
  if (!scheduledDate) return res.status(400).json({ error: 'Scheduled PM Date wajib diisi.' })
  if (!assignedTo) return res.status(400).json({ error: 'Responsible Technician wajib diisi.' })
  const nextId = String(mock.upcomingPM.length + 1)
  const nextPmId = `PM${2400 + mock.upcomingPM.length + 1}`
  const newPM: (typeof mock.upcomingPM)[0] = {
    id: nextId,
    pmId: nextPmId,
    assetName,
    activity,
    scheduledDate,
    assignedTo,
    assetSerialNumber: body.assetSerialNumber != null ? String(body.assetSerialNumber).trim() : undefined,
    assetLocation: body.assetLocation != null ? String(body.assetLocation).trim() : undefined,
    pmType: body.pmType != null ? String(body.pmType).trim() : undefined,
    pmCategory: body.pmCategory != null ? String(body.pmCategory).trim() : undefined,
    startTime: body.startTime != null ? String(body.startTime).trim() : undefined,
    endTime: body.endTime != null ? String(body.endTime).trim() : undefined,
    frequency: body.frequency != null ? String(body.frequency).trim() : undefined,
    manpower: typeof body.manpower === 'number' ? body.manpower : undefined,
    shiftSchedule: body.shiftSchedule != null ? String(body.shiftSchedule).trim() : undefined,
    requiredEquipment: body.requiredEquipment != null ? String(body.requiredEquipment).trim() : undefined,
    sparePartsList: body.sparePartsList != null ? String(body.sparePartsList).trim() : undefined,
    detailedInstructions: body.detailedInstructions != null ? String(body.detailedInstructions).trim() : undefined,
    proceduralDocLink: body.proceduralDocLink != null ? String(body.proceduralDocLink).trim() : undefined,
    priority: body.priority != null ? String(body.priority).trim() : undefined,
    pmStatus: body.pmStatus != null ? String(body.pmStatus).trim() : undefined,
    approvalStatus: body.approvalStatus != null ? String(body.approvalStatus).trim() : undefined,
    reminderEnabled: body.reminderEnabled === true,
    warningDays: typeof body.warningDays === 'number' ? body.warningDays : undefined,
    specialNotes: body.specialNotes != null ? String(body.specialNotes).trim() : undefined,
    feedback: body.feedback != null ? String(body.feedback).trim() : undefined,
    managerApproval: body.managerApproval != null ? String(body.managerApproval).trim() : undefined,
    auditTrail: body.auditTrail != null ? String(body.auditTrail).trim() : undefined,
    photoUrls: body.photoUrls != null ? String(body.photoUrls).trim() : undefined,
    reportGenerated: body.reportGenerated === true,
    keteranganStatus: body.keteranganStatus === 'PM OK' || body.keteranganStatus === 'Belum Selesai' || body.keteranganStatus === 'Pending' ? body.keteranganStatus : undefined,
    keteranganNotes: body.keteranganNotes != null ? String(body.keteranganNotes).trim() : undefined,
  }
  mock.upcomingPM.push(newPM)
  res.status(201).json(newPM)
})

dashboardRouter.get('/dashboard/quick-stats', (_, res) => {
  res.json(mock.quickStats)
})

dashboardRouter.get('/dashboard/wo-status', (_, res) => {
  res.json(mock.woStatusDistribution)
})

dashboardRouter.get('/dashboard/asset-health', (_, res) => {
  res.json(mock.assetHealthCounts)
})
