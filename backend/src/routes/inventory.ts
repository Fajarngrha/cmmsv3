import { Router } from 'express'
import { query } from '../db/index.js'
import { rowToSparePart, rowToSparePartMovement } from '../db/mappers.js'

export const inventoryRouter = Router()

inventoryRouter.get('/inventory/spare-parts', async (_, res) => {
  try {
    const result = await query('SELECT * FROM spare_parts ORDER BY id')
    res.json(result.rows.map((r) => rowToSparePart(r)))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengambil data spare parts' })
  }
})

inventoryRouter.post('/inventory/spare-parts', async (req, res) => {
  try {
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
      pic?: string
    }
    if (!body.name?.trim()) return res.status(400).json({ error: 'Nama spare part wajib diisi.' })
    if (!body.category?.trim()) return res.status(400).json({ error: 'Kategori wajib diisi.' })
    const countResult = await query('SELECT COUNT(*)::int AS c FROM spare_parts')
    const nextNum = (countResult.rows[0]?.c ?? 0) + 1
    const partCode = body.partCode?.trim() || `PRT-${String(nextNum).padStart(3, '0')}`
    const existing = await query('SELECT id FROM spare_parts WHERE LOWER(part_code) = LOWER($1)', [partCode])
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Part code sudah digunakan.' })
    const stock = typeof body.stock === 'number' ? body.stock : Number(body.stock) || 0
    const minStock = typeof body.minStock === 'number' ? body.minStock : Number(body.minStock) || 0
    const result = await query(
      `INSERT INTO spare_parts (part_code, name, category, stock, min_stock, unit, location, spec, for_machine)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        partCode,
        body.name.trim(),
        body.category.trim(),
        stock >= 0 ? stock : 0,
        minStock >= 0 ? minStock : 0,
        body.unit?.trim() || 'pcs',
        body.location?.trim() || '',
        body.spec?.trim() || null,
        body.forMachine?.trim() || null,
      ]
    )
    const newPart = rowToSparePart(result.rows[0])
    if (newPart.stock > 0) {
      await query(
        `INSERT INTO spare_part_history (part_id, part_code, part_name, type, qty, unit, reason, pic)
         VALUES ($1, $2, $3, 'in', $4, $5, 'Stok awal', $6)`,
        [result.rows[0].id, newPart.partCode, newPart.name, newPart.stock, newPart.unit, body.pic?.trim() || null]
      )
    }
    res.status(201).json(newPart)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal menambah spare part' })
  }
})

inventoryRouter.post('/inventory/spare-parts/import', async (req, res) => {
  try {
    const body = req.body as {
      parts: Array<{
        partCode?: string
        name?: string
        category?: string
        stock?: number
        minStock?: number
        unit?: string
        location?: string
        spec?: string
        forMachine?: string
      }>
    }
    const list = Array.isArray(body?.parts) ? body.parts : []
    if (list.length === 0) return res.status(400).json({ error: 'Data spare parts kosong. Kirim array parts.' })
    const created: ReturnType<typeof rowToSparePart>[] = []
    let skipped = 0
    let countResult = await query('SELECT COUNT(*)::int AS c FROM spare_parts')
    let nextNum = countResult.rows[0]?.c ?? 0
    for (const row of list) {
      if (!row.name?.trim() || !row.category?.trim()) continue
      nextNum += 1
      const partCode = row.partCode?.trim() || `PRT-${String(nextNum).padStart(3, '0')}`
      const existing = await query('SELECT id FROM spare_parts WHERE LOWER(part_code) = LOWER($1)', [partCode])
      if (existing.rows.length > 0) {
        skipped += 1
        continue
      }
      const stock = typeof row.stock === 'number' ? row.stock : Number(row.stock) || 0
      const minStock = typeof row.minStock === 'number' ? row.minStock : Number(row.minStock) || 0
      const result = await query(
        `INSERT INTO spare_parts (part_code, name, category, stock, min_stock, unit, location, spec, for_machine)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          partCode,
          row.name.trim(),
          row.category.trim(),
          stock >= 0 ? stock : 0,
          minStock >= 0 ? minStock : 0,
          row.unit?.trim() || 'pcs',
          row.location?.trim() || '',
          row.spec?.trim() || null,
          row.forMachine?.trim() || null,
        ]
      )
      const newPart = rowToSparePart(result.rows[0])
      if (newPart.stock > 0) {
        await query(
          `INSERT INTO spare_part_history (part_id, part_code, part_name, type, qty, unit, reason)
           VALUES ($1, $2, $3, 'in', $4, $5, 'Stok awal (import)')`,
          [result.rows[0].id, newPart.partCode, newPart.name, newPart.stock, newPart.unit]
        )
      }
      created.push(newPart)
    }
    res.status(201).json({ imported: created.length, skipped, parts: created })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengimpor spare parts' })
  }
})

inventoryRouter.get('/inventory/spare-parts/history', async (req, res) => {
  try {
    const type = req.query.type as string | undefined
    let sql = `SELECT h.* FROM spare_part_history h ORDER BY h.created_at DESC`
    let result
    if (type === 'in' || type === 'out') {
      result = await query(`SELECT * FROM spare_part_history WHERE type = $1 ORDER BY created_at DESC`, [type])
    } else {
      result = await query('SELECT * FROM spare_part_history ORDER BY created_at DESC')
    }
    res.json(result.rows.map((r) => rowToSparePartMovement(r)))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengambil history spare part' })
  }
})

inventoryRouter.delete('/inventory/spare-parts/history', async (req, res) => {
  try {
    const type = req.query.type as string | undefined
    let result
    if (type === 'in' || type === 'out') {
      result = await query('DELETE FROM spare_part_history WHERE type = $1', [type])
    } else {
      result = await query('DELETE FROM spare_part_history')
    }
    res.json({ deleted: result.rowCount ?? 0 })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal menghapus history spare part' })
  }
})

inventoryRouter.patch('/inventory/spare-parts/:id', async (req, res) => {
  try {
    const id = req.params.id
    const body = req.body as {
      name?: string
      spec?: string
      forMachine?: string
      category?: string
      minStock?: number
      location?: string
    }

    const updates: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (typeof body.name === 'string') {
      const name = body.name.trim()
      if (!name) return res.status(400).json({ error: 'Nama spare part wajib diisi.' })
      updates.push(`name = $${idx++}`)
      params.push(name)
    }

    if (typeof body.spec === 'string') {
      updates.push(`spec = $${idx++}`)
      params.push(body.spec.trim() || null)
    }

    if (typeof body.forMachine === 'string') {
      updates.push(`for_machine = $${idx++}`)
      params.push(body.forMachine.trim() || null)
    }

    if (typeof body.category === 'string') {
      const category = body.category.trim()
      if (!category) return res.status(400).json({ error: 'Kategori wajib diisi.' })
      updates.push(`category = $${idx++}`)
      params.push(category)
    }

    if (body.minStock !== undefined) {
      const minStock = typeof body.minStock === 'number' ? body.minStock : Number(body.minStock)
      if (!Number.isInteger(minStock) || minStock < 0) {
        return res.status(400).json({ error: 'Min stock harus bilangan bulat >= 0.' })
      }
      updates.push(`min_stock = $${idx++}`)
      params.push(minStock)
    }

    if (typeof body.location === 'string') {
      updates.push(`location = $${idx++}`)
      params.push(body.location.trim())
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah.' })
    }

    params.push(id)
    const result = await query(
      `UPDATE spare_parts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Spare part tidak ditemukan.' })

    res.json(rowToSparePart(result.rows[0]))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengubah data spare part' })
  }
})

inventoryRouter.delete('/inventory/spare-parts/:id', async (req, res) => {
  try {
    const id = req.params.id
    const deleted = await query('DELETE FROM spare_parts WHERE id = $1 RETURNING id', [id])
    if (deleted.rows.length === 0) return res.status(404).json({ error: 'Spare part tidak ditemukan.' })
    res.status(204).send()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal menghapus spare part' })
  }
})

inventoryRouter.patch('/inventory/spare-parts/:id/issue', async (req, res) => {
  try {
    const id = req.params.id
    const body = req.body as { qty?: number; reason?: string; pic?: string }
    const pic = typeof body.pic === 'string' ? body.pic.trim() : ''
    if (!pic) return res.status(400).json({ error: 'PIC wajib diisi.' })
    const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty)
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: 'Jumlah keluar (qty) harus bilangan bulat positif.' })
    const partResult = await query('SELECT * FROM spare_parts WHERE id = $1', [id])
    if (partResult.rows.length === 0) return res.status(404).json({ error: 'Spare part tidak ditemukan.' })
    const row = partResult.rows[0]
    const stock = Number(row.stock)
    if (stock < qty) return res.status(400).json({ error: `Stock tidak cukup. Tersedia: ${stock} ${row.unit}.` })
    await query('UPDATE spare_parts SET stock = stock - $1 WHERE id = $2', [qty, id])
    await query(
      `INSERT INTO spare_part_history (part_id, part_code, part_name, type, qty, unit, reason, pic)
       VALUES ($1, $2, $3, 'out', $4, $5, $6, $7)`,
      [id, row.part_code, row.name, qty, row.unit, body.reason?.trim() || null, pic]
    )
    const updated = await query('SELECT * FROM spare_parts WHERE id = $1', [id])
    res.json(rowToSparePart(updated.rows[0]))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengeluarkan spare part' })
  }
})

inventoryRouter.patch('/inventory/spare-parts/:id/receive', async (req, res) => {
  try {
    const id = req.params.id
    const body = req.body as { qty?: number; reason?: string; pic?: string }
    const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty)
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: 'Qty masuk harus bilangan bulat positif.' })
    const partResult = await query('SELECT * FROM spare_parts WHERE id = $1', [id])
    if (partResult.rows.length === 0) return res.status(404).json({ error: 'Spare part tidak ditemukan.' })
    const row = partResult.rows[0]
    await query('UPDATE spare_parts SET stock = stock + $1 WHERE id = $2', [qty, id])
    await query(
      `INSERT INTO spare_part_history (part_id, part_code, part_name, type, qty, unit, reason, pic)
       VALUES ($1, $2, $3, 'in', $4, $5, $6, $7)`,
      [id, row.part_code, row.name, qty, row.unit, body.reason?.trim() || null, body.pic?.trim() || null]
    )
    const updated = await query('SELECT * FROM spare_parts WHERE id = $1', [id])
    res.json(rowToSparePart(updated.rows[0]))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mencatat stok masuk' })
  }
})
