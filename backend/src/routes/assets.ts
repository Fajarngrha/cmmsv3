import { Router } from 'express'
import { mock } from '../data/mock.js'

export const assetsRouter = Router()

assetsRouter.get('/assets', (_, res) => {
  res.json(mock.assets)
})

assetsRouter.post('/assets', (req, res) => {
  const body = req.body as {
    assetId?: string
    name: string
    section: string
    health?: 'Running' | 'Warning' | 'Breakdown'
    lastPmDate?: string
    nextPmDate?: string
    uptimePercent?: number
    installedAt?: string
  }
  if (!body.name?.trim()) {
    return res.status(400).json({ error: 'Nama asset wajib diisi.' })
  }
  if (!body.section?.trim()) {
    return res.status(400).json({ error: 'Section wajib diisi.' })
  }
  const health = body.health && ['Running', 'Warning', 'Breakdown'].includes(body.health)
    ? body.health
    : 'Running'
  const nextId = String(mock.assets.length + 1)
  const nextAssetId = body.assetId?.trim() || `AST-${String(mock.assets.length + 1).padStart(3, '0')}`
  const today = new Date().toISOString().slice(0, 10)
  const newAsset = {
    id: nextId,
    assetId: nextAssetId,
    name: body.name.trim(),
    section: body.section.trim(),
    health,
    lastPmDate: body.lastPmDate?.trim() || today,
    nextPmDate: body.nextPmDate?.trim() || today,
    uptimePercent: typeof body.uptimePercent === 'number' ? body.uptimePercent : 100,
    ...(body.installedAt?.trim() && { installedAt: body.installedAt.trim() }),
  }
  mock.assets.push(newAsset as (typeof mock.assets)[0])
  res.status(201).json(newAsset)
})

assetsRouter.delete('/assets/:id', (req, res) => {
  const idx = mock.assets.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Asset tidak ditemukan.' })
  mock.assets.splice(idx, 1)
  res.status(204).send()
})
