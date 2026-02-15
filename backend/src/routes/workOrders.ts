import { Router } from 'express'
import { mock } from '../data/mock.js'

export const workOrdersRouter = Router()

workOrdersRouter.get('/work-orders', (_, res) => {
  res.json(mock.workOrders)
})

workOrdersRouter.get('/work-orders/:id', (req, res) => {
  const wo = mock.workOrders.find((w) => w.id === req.params.id)
  if (!wo) return res.status(404).json({ error: 'Work order not found' })
  res.json(wo)
})

workOrdersRouter.patch('/work-orders/:id', (req, res) => {
  const wo = mock.workOrders.find((w) => w.id === req.params.id)
  if (!wo) return res.status(404).json({ error: 'Work order not found' })

  const body = req.body as {
    status?: 'Open' | 'In Progress' | 'PM' | 'Pending' | 'Completed'
    causeOfDamage?: string
    repairsPerformed?: string
    actionType?: string
    replacedSpareParts?: string
    replacedPartsSpec?: string
    replacedPartsQty?: number
    technician?: string
    pendingReason?: string
    pmScheduledDate?: string
  }

  // Open: bisa dari Pending / In Progress (reset)
  if (body.status === 'Open') {
    wo.status = 'Open'
    delete wo.startedAt
    delete wo.pendingReason
    return res.json(wo)
  }

  // In Progress: dari Open atau Pending
  if (body.status === 'In Progress' && (wo.status === 'Open' || wo.status === 'Pending')) {
    wo.status = 'In Progress'
    wo.startedAt = new Date().toISOString()
    if (wo.pendingReason) delete wo.pendingReason
    return res.json(wo)
  }

  // PM: wajib isi tanggal PM, otomatis masuk schedule preventive maintenance
  if (body.status === 'PM') {
    const pmDate = body.pmScheduledDate?.trim()
    if (!pmDate) return res.status(400).json({ error: 'Tanggal PM wajib diisi.' })
    wo.status = 'PM'
    wo.type = 'PM'
    wo.pmScheduledDate = pmDate
    const nextPmId = `PM${2400 + mock.upcomingPM.length + 1}`
    mock.upcomingPM.push({
      id: String(mock.upcomingPM.length + 1),
      pmId: nextPmId,
      assetName: wo.machineName,
      activity: wo.damageType || 'Preventive',
      scheduledDate: pmDate,
      assignedTo: wo.technician || '—',
    })
    return res.json(wo)
  }

  // Pending: wajib isi alasan pending
  if (body.status === 'Pending') {
    const reason = body.pendingReason?.trim()
    if (!reason) return res.status(400).json({ error: 'Alasan pending wajib diisi.' })
    wo.status = 'Pending'
    wo.pendingReason = reason
    return res.json(wo)
  }

  // Completed: dari In Progress + form closure
  if (body.status === 'Completed' && wo.status === 'In Progress') {
    const closedAt = new Date()
    const started = wo.startedAt ? new Date(wo.startedAt).getTime() : closedAt.getTime()
    wo.status = 'Completed'
    wo.closedAt = closedAt.toISOString()
    wo.totalDowntimeHours = Math.round(((closedAt.getTime() - started) / (1000 * 60 * 60)) * 100) / 100
    if (body.causeOfDamage != null) wo.causeOfDamage = body.causeOfDamage
    if (body.repairsPerformed != null) wo.repairsPerformed = body.repairsPerformed
    if (body.actionType != null) wo.actionType = body.actionType
    if (body.replacedSpareParts != null) wo.replacedSpareParts = body.replacedSpareParts
    if (body.replacedPartsSpec != null) wo.replacedPartsSpec = body.replacedPartsSpec
    if (body.replacedPartsQty != null) wo.replacedPartsQty = body.replacedPartsQty
    if (body.technician != null) wo.technician = body.technician
    return res.json(wo)
  }

  return res.status(400).json({ error: 'Invalid status transition' })
})

workOrdersRouter.post('/work-orders', (req, res) => {
  const body = req.body as {
    machineName: string
    machineBrand?: string
    section: string
    machineStatus: string
    damageDescription: string
    reportedBy?: string
  }
  const now = new Date()
  const nextId = String(mock.workOrders.length + 1)
  const nextWoId = `WO${1000 + mock.workOrders.length + 1}`
  const newWO = {
    id: nextId,
    woId: nextWoId,
    machineName: body.machineName ?? '',
    machineBrand: body.machineBrand ?? '',
    section: body.section ?? '',
    machineStatus: body.machineStatus ?? '',
    damageType: body.damageDescription ?? '',
    status: 'Open' as const,
    dueDate: now.toISOString().slice(0, 10),
    reportedBy: body.reportedBy ?? 'Tim Produksi',
    createdAt: now.toISOString(),
  }
  mock.workOrders.unshift(newWO as (typeof mock.workOrders)[0])
  res.status(201).json(newWO)
})

workOrdersRouter.delete('/work-orders/:id', (req, res) => {
  const idx = mock.workOrders.findIndex((w) => w.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Work order not found' })
  mock.workOrders.splice(idx, 1)
  res.status(204).send()
})
