import { Router } from 'express'
import type { POKategori, POStatus } from '../data/mock.js'
import { query } from '../db/index.js'
import { rowToPurchaseOrder } from '../db/mappers.js'

export const purchaseOrdersRouter = Router()

const STATUS_OPTIONS: POStatus[] = ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7']

async function nextNoRegistrasi(): Promise<string> {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)
  const prefix = `MTC/SPB/${mm}/${yy}/`
  const result = await query<{ no_registrasi: string }>(
    `SELECT no_registrasi FROM purchase_orders WHERE no_registrasi LIKE $1 ORDER BY no_registrasi DESC`,
    [`${prefix}%`]
  )
  let maxNum = 0
  for (const row of result.rows) {
    const n = parseInt(row.no_registrasi.slice(prefix.length), 10)
    if (!Number.isNaN(n) && n > maxNum) maxNum = n
  }
  const nextNum = maxNum + 1
  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

purchaseOrdersRouter.get('/purchase-orders', async (_, res) => {
  try {
    const result = await query(
      `SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders ORDER BY id DESC`
    )
    res.json(result.rows.map((r) => rowToPurchaseOrder(r)))
  } catch (err) {
    console.error('GET /purchase-orders', err)
    res.status(500).json({ error: 'Gagal mengambil data PO.' })
  }
})

purchaseOrdersRouter.get('/purchase-orders/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'PO tidak ditemukan.' })
    res.json(rowToPurchaseOrder(result.rows[0]))
  } catch (err) {
    console.error('GET /purchase-orders/:id', err)
    res.status(500).json({ error: 'Gagal mengambil data PO.' })
  }
})

purchaseOrdersRouter.patch('/purchase-orders/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body as { noPO?: string; status?: POStatus; noQuotation?: string; [key: string]: unknown }
  try {
    const updates: string[] = []
    const params: unknown[] = []
    let idx = 1
    if (body.noPO !== undefined) {
      updates.push(`no_po = $${idx++}`)
      params.push(String(body.noPO).trim())
    }
    if (body.noQuotation !== undefined) {
      updates.push(`no_quotation = $${idx++}`)
      params.push(String(body.noQuotation).trim())
    }
    if (body.status && STATUS_OPTIONS.includes(body.status)) {
      updates.push(`status = $${idx++}`)
      params.push(body.status)
    }
    if (updates.length === 0) {
      const r = await query(
        `SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`,
        [id]
      )
      if (r.rows.length === 0) return res.status(404).json({ error: 'PO tidak ditemukan.' })
      return res.json(rowToPurchaseOrder(r.rows[0]))
    }
    params.push(id)
    const result = await query(
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status`,
      params
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'PO tidak ditemukan.' })
    res.json(rowToPurchaseOrder(result.rows[0]))
  } catch (err) {
    console.error('PATCH /purchase-orders/:id', err)
    res.status(500).json({ error: 'Gagal memperbarui PO.' })
  }
})

purchaseOrdersRouter.post('/purchase-orders', async (req, res) => {
  const body = req.body as {
    tanggal?: string
    itemDeskripsi?: string
    model?: string
    hargaPerUnit?: number
    qty?: number
    noPO?: string
    mesin?: string
    noQuotation?: string
    supplier?: string
    kategori?: POKategori
    status?: POStatus
  }
  if (!body.tanggal?.trim()) return res.status(400).json({ error: 'Tanggal wajib diisi.' })
  if (!body.itemDeskripsi?.trim()) return res.status(400).json({ error: 'Item Deskripsi wajib diisi.' })
  const hargaPerUnit = typeof body.hargaPerUnit === 'number' ? body.hargaPerUnit : Number(body.hargaPerUnit) || 0
  const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty) || 0
  const totalHarga = hargaPerUnit * qty
  const kategoriOptions: POKategori[] = ['Preventive', 'Sparepart', 'Breakdown/Repair']
  const kategori = body.kategori && kategoriOptions.includes(body.kategori) ? body.kategori : 'Sparepart'
  const status = body.status && STATUS_OPTIONS.includes(body.status) ? body.status : 'Tahap 1'
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const noRegistrasi = await nextNoRegistrasi()
      const result = await query(
        `INSERT INTO purchase_orders (tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status`,
        [
          body.tanggal.trim(),
          body.itemDeskripsi.trim(),
          (body.model ?? '').trim() || null,
          hargaPerUnit,
          qty,
          noRegistrasi,
          (body.noPO ?? '').trim() || null,
          (body.mesin ?? '').trim() || null,
          (body.noQuotation ?? '').trim() || null,
          (body.supplier ?? '').trim() || null,
          kategori,
          totalHarga,
          status,
        ]
      )
      return res.status(201).json(rowToPurchaseOrder(result.rows[0]))
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === '23505' && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 80 * attempt))
        continue
      }
      console.error('POST /purchase-orders', err)
      return res.status(500).json({ error: 'Gagal menambah PO.' })
    }
  }
})

purchaseOrdersRouter.delete('/purchase-orders/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'PO tidak ditemukan.' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /purchase-orders', err)
    res.status(500).json({ error: 'Gagal menghapus PO.' })
  }
})
