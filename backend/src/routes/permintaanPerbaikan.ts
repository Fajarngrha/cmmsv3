import { Router } from 'express'
import { query } from '../db/index.js'
import { rowToWorkOrder } from '../db/mappers.js'

export const permintaanPerbaikanRouter = Router()

permintaanPerbaikanRouter.get('/permintaan-perbaikan', async (_, res) => {
  try {
    const result = await query('SELECT * FROM permintaan_perbaikan ORDER BY created_at DESC')
    res.json(result.rows.map((r) => rowToWorkOrder(r)))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengambil data permintaan perbaikan' })
  }
})

permintaanPerbaikanRouter.get('/permintaan-perbaikan/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permintaan perbaikan tidak ditemukan' })
    res.json(rowToWorkOrder(result.rows[0]))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal mengambil data' })
  }
})

permintaanPerbaikanRouter.patch('/permintaan-perbaikan/:id', async (req, res) => {
  try {
    const id = req.params.id
    const result = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Permintaan perbaikan tidak ditemukan' })
    const row = result.rows[0]

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

    if (body.status === 'Open') {
      await query(
        'UPDATE permintaan_perbaikan SET status = $1, started_at = NULL, pending_reason = NULL WHERE id = $2',
        ['Open', id]
      )
      const r = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
      return res.json(rowToWorkOrder(r.rows[0]))
    }

    if (body.status === 'In Progress' && (row.status === 'Open' || row.status === 'Pending')) {
      await query(
        'UPDATE permintaan_perbaikan SET status = $1, started_at = CURRENT_TIMESTAMP, pending_reason = NULL WHERE id = $2',
        ['In Progress', id]
      )
      const r = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
      return res.json(rowToWorkOrder(r.rows[0]))
    }

    if (body.status === 'PM') {
      const pmDate = body.pmScheduledDate?.trim()
      if (!pmDate) return res.status(400).json({ error: 'Tanggal PM wajib diisi.' })
      const countResult = await query('SELECT COUNT(*)::int AS c FROM upcoming_pm')
      const nextPmNum = (countResult.rows[0]?.c ?? 0) + 1
      const nextPmId = `PM${2400 + nextPmNum}`
      await query(
        'INSERT INTO upcoming_pm (pm_id, asset_name, activity, scheduled_date, assigned_to) VALUES ($1, $2, $3, $4, $5)',
        [nextPmId, row.machine_name, row.damage_type || 'Preventive', pmDate, row.technician || '—']
      )
      await query(
        'UPDATE permintaan_perbaikan SET status = $1, type = $2, pm_scheduled_date = $3 WHERE id = $4',
        ['PM', 'PM', pmDate, id]
      )
      const r = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
      return res.json(rowToWorkOrder(r.rows[0]))
    }

    if (body.status === 'Pending') {
      const reason = body.pendingReason?.trim()
      if (!reason) return res.status(400).json({ error: 'Alasan pending wajib diisi.' })
      await query('UPDATE permintaan_perbaikan SET status = $1, pending_reason = $2 WHERE id = $3', [
        'Pending',
        reason,
        id,
      ])
      const r = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
      return res.json(rowToWorkOrder(r.rows[0]))
    }

    if (body.status === 'Completed' && row.status === 'In Progress') {
      const closedAt = new Date()
      const started = row.started_at ? new Date(row.started_at as string).getTime() : closedAt.getTime()
      const totalDowntimeHours = Math.round(((closedAt.getTime() - started) / (1000 * 60 * 60)) * 100) / 100
      await query(
        `UPDATE permintaan_perbaikan SET status = $1, closed_at = $2, total_downtime_hours = $3,
         cause_of_damage = COALESCE($4, cause_of_damage), repairs_performed = COALESCE($5, repairs_performed),
         action_type = COALESCE($6, action_type), replaced_spare_parts = COALESCE($7, replaced_spare_parts),
         replaced_parts_spec = COALESCE($8, replaced_parts_spec), replaced_parts_qty = COALESCE($9, replaced_parts_qty),
         technician = COALESCE($10, technician) WHERE id = $11`,
        [
          'Completed',
          closedAt.toISOString(),
          totalDowntimeHours,
          body.causeOfDamage ?? null,
          body.repairsPerformed ?? null,
          body.actionType ?? null,
          body.replacedSpareParts ?? null,
          body.replacedPartsSpec ?? null,
          body.replacedPartsQty ?? null,
          body.technician ?? null,
          id,
        ]
      )
      const r = await query('SELECT * FROM permintaan_perbaikan WHERE id = $1', [id])
      return res.json(rowToWorkOrder(r.rows[0]))
    }

    return res.status(400).json({ error: 'Invalid status transition' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal memperbarui permintaan perbaikan' })
  }
})

permintaanPerbaikanRouter.post('/permintaan-perbaikan', async (req, res) => {
  try {
    const body = req.body as {
      machineName: string
      machineBrand?: string
      section: string
      machineStatus: string
      damageDescription: string
      reportedBy?: string
    }
    const countResult = await query('SELECT COUNT(*)::int AS c FROM permintaan_perbaikan')
    const nextNum = (countResult.rows[0]?.c ?? 0) + 1
    const nextWoId = `Req${1000 + nextNum}`
    const dueDate = new Date().toISOString().slice(0, 10)
    const result = await query(
      `INSERT INTO permintaan_perbaikan (wo_id, machine_name, machine_brand, section, machine_status, damage_type, status, due_date, reported_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'Open', $7, $8) RETURNING *`,
      [
        nextWoId,
        body.machineName ?? '',
        body.machineBrand ?? null,
        body.section ?? '',
        body.machineStatus ?? null,
        body.damageDescription ?? '',
        dueDate,
        body.reportedBy ?? 'Tim Produksi',
      ]
    )
    res.status(201).json(rowToWorkOrder(result.rows[0]))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal membuat permintaan perbaikan' })
  }
})

permintaanPerbaikanRouter.delete('/permintaan-perbaikan/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM permintaan_perbaikan WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Permintaan perbaikan tidak ditemukan' })
    res.status(204).send()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Gagal menghapus permintaan perbaikan' })
  }
})
