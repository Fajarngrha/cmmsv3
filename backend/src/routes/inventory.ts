import { Router } from 'express'
import { mock } from '../data/mock.js'
import type { SparePart, SparePartMovement } from '../data/mock.js'

export const inventoryRouter = Router()

inventoryRouter.get('/inventory/spare-parts', (_, res) => {
  res.json(mock.spareParts)
})

// Tambah spare part baru
inventoryRouter.post('/inventory/spare-parts', (req, res) => {
  const body = req.body as {
    partCode?: string
    name?: string
    category?: string
    stock?: number
    minStock?: number
    unit?: string
    location?: string
    spec?: string
    forMachine?: string
  }
  if (!body.name?.trim()) {
    return res.status(400).json({ error: 'Nama spare part wajib diisi.' })
  }
  if (!body.category?.trim()) {
    return res.status(400).json({ error: 'Kategori wajib diisi.' })
  }
  const partCode = body.partCode?.trim() || `PRT-${String(mock.spareParts.length + 1).padStart(3, '0')}`
  const existing = mock.spareParts.find((p) => p.partCode.toLowerCase() === partCode.toLowerCase())
  if (existing) {
    return res.status(400).json({ error: 'Part code sudah digunakan.' })
  }
  const stock = typeof body.stock === 'number' ? body.stock : Number(body.stock) || 0
  const minStock = typeof body.minStock === 'number' ? body.minStock : Number(body.minStock) || 0
  const id = String(mock.spareParts.length + 1)
  const newPart: SparePart = {
    id,
    partCode,
    name: body.name.trim(),
    category: body.category.trim(),
    stock: stock >= 0 ? stock : 0,
    minStock: minStock >= 0 ? minStock : 0,
    unit: body.unit?.trim() || 'pcs',
    location: body.location?.trim() || '',
    spec: body.spec?.trim() || undefined,
    forMachine: body.forMachine?.trim() || undefined,
  }
  mock.spareParts.push(newPart)
  // Catat stok awal sebagai transaksi "masuk" untuk audit
  if (newPart.stock > 0) {
    const histId = String(mock.sparePartHistory.length + 1)
    const movement: SparePartMovement = {
      id: histId,
      partId: newPart.id,
      partCode: newPart.partCode,
      partName: newPart.name,
      type: 'in',
      qty: newPart.stock,
      unit: newPart.unit,
      reason: 'Stok awal',
      pic: (body as { pic?: string }).pic?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    mock.sparePartHistory.unshift(movement)
  }
  res.status(201).json(newPart)
})

// History spare part masuk & keluar (untuk audit)
inventoryRouter.get('/inventory/spare-parts/history', (req, res) => {
  const type = req.query.type as string | undefined
  let list = [...mock.sparePartHistory]
  if (type === 'in' || type === 'out') {
    list = list.filter((h) => h.type === type)
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json(list)
})

// Keluar spare part (kurangi stock)
inventoryRouter.patch('/inventory/spare-parts/:id/issue', (req, res) => {
  const id = req.params.id
  const body = req.body as { qty?: number; reason?: string; pic?: string }
  const pic = typeof body.pic === 'string' ? body.pic.trim() : ''
  if (!pic) {
    return res.status(400).json({ error: 'PIC wajib diisi.' })
  }
  const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty)
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Jumlah keluar (qty) harus bilangan bulat positif.' })
  }
  const part = mock.spareParts.find((p) => p.id === id)
  if (!part) {
    return res.status(404).json({ error: 'Spare part tidak ditemukan.' })
  }
  if (part.stock < qty) {
    return res.status(400).json({ error: `Stock tidak cukup. Tersedia: ${part.stock} ${part.unit}.` })
  }
  part.stock -= qty
  const histId = String(mock.sparePartHistory.length + 1)
  const movement: SparePartMovement = {
    id: histId,
    partId: part.id,
    partCode: part.partCode,
    partName: part.name,
    type: 'out',
    qty,
    unit: part.unit,
    reason: body.reason?.trim() || undefined,
    pic,
    createdAt: new Date().toISOString(),
  }
  mock.sparePartHistory.unshift(movement)
  res.json(part)
})
