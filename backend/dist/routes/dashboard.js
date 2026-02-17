import { Router } from 'express';
import { query } from '../db/index.js';
import { rowToUpcomingPM } from '../db/mappers.js';
export const dashboardRouter = Router();
dashboardRouter.get('/dashboard/kpis', async (_, res) => {
    try {
        const [costRow, woRows, pmRows, assetRows] = await Promise.all([
            query('SELECT COALESCE(SUM(total_harga), 0)::text AS sum FROM purchase_orders'),
            query('SELECT status, COUNT(*)::text AS c FROM permintaan_perbaikan GROUP BY status'),
            query('SELECT id, keterangan_status FROM upcoming_pm'),
            query('SELECT health, COUNT(*)::text AS c FROM assets GROUP BY health'),
        ]);
        const totalMaintenanceCost = Number(costRow.rows[0]?.sum ?? 0);
        const woCountByStatus = {};
        woRows.rows.forEach((r) => { woCountByStatus[r.status] = parseInt(r.c, 10); });
        const openWorkOrders = (woCountByStatus['Open'] ?? 0) + (woCountByStatus['Pending'] ?? 0) + (woCountByStatus['PM'] ?? 0);
        const assetsInMaintenance = woCountByStatus['In Progress'] ?? 0;
        const totalPM = pmRows.rows.length;
        const compliantCount = pmRows.rows.filter((r) => r.keterangan_status === 'PM OK').length;
        const pmCompliance = totalPM > 0 ? Math.round((compliantCount / totalPM) * 100) : 0;
        const breakdownCount = assetRows.rows.find((r) => r.health === 'Breakdown')?.c ?? 0;
        res.json({
            pmCompliance,
            pmComplianceRate: pmCompliance,
            totalDowntimeHours: 0,
            maintenanceCostIdr: totalMaintenanceCost,
            breakdownCount: parseInt(String(breakdownCount), 10),
            openWorkOrders,
            overdueCount: 0,
            workOrdersDueToday: 0,
            assetsInMaintenance,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil KPIs' });
    }
});
dashboardRouter.get('/dashboard/trend', async (_, res) => {
    try {
        const result = await query(`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS ym,
              TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month, type, COUNT(*)::text AS c
       FROM permintaan_perbaikan
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at), type
       ORDER BY ym`);
        const byMonth = {};
        result.rows.forEach((r) => {
            if (!byMonth[r.ym])
                byMonth[r.ym] = { month: r.month, reactiveWOs: 0, preventiveWOs: 0 };
            const count = parseInt(r.c, 10);
            if (r.type === 'PM')
                byMonth[r.ym].preventiveWOs += count;
            else
                byMonth[r.ym].reactiveWOs += count;
        });
        res.json(Object.values(byMonth));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil trend' });
    }
});
dashboardRouter.get('/dashboard/pareto', async (_, res) => {
    try {
        const result = await query(`SELECT COALESCE(LEFT(cause_of_damage, 50), 'Lainnya') AS cause_of_damage,
              COALESCE(SUM(total_downtime_hours), 0)::numeric AS hours
       FROM permintaan_perbaikan
       WHERE status = 'Completed' AND total_downtime_hours IS NOT NULL
       GROUP BY COALESCE(LEFT(cause_of_damage, 50), 'Lainnya')
       ORDER BY hours DESC
       LIMIT 10`);
        let cum = 0;
        const total = result.rows.reduce((s, r) => s + parseFloat(r.hours || '0'), 0);
        const data = result.rows.map((r) => {
            const hours = parseFloat(r.hours || '0');
            cum += hours;
            return {
                cause: r.cause_of_damage || 'Lainnya',
                hours: Math.round(hours * 100) / 100,
                cumulativePercent: total > 0 ? Math.round((cum / total) * 100) : 0,
            };
        });
        res.json(data);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil pareto' });
    }
});
dashboardRouter.get('/dashboard/upcoming-pm', async (_, res) => {
    try {
        const result = await query('SELECT * FROM upcoming_pm ORDER BY scheduled_date ASC, id ASC');
        res.json(result.rows.map((r) => rowToUpcomingPM(r)));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil jadwal PM' });
    }
});
dashboardRouter.patch('/dashboard/upcoming-pm/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;
        const updates = [];
        const params = [];
        let idx = 1;
        if (body.keteranganStatus !== undefined) {
            const v = String(body.keteranganStatus).trim();
            if (v === 'PM OK' || v === 'Belum Selesai' || v === 'Pending') {
                updates.push(`keterangan_status = $${idx++}`);
                params.push(v);
            }
        }
        if (body.keteranganNotes !== undefined) {
            updates.push(`keterangan_notes = $${idx++}`);
            params.push(String(body.keteranganNotes).trim() || null);
        }
        if (updates.length === 0) {
            const r = await query('SELECT * FROM upcoming_pm WHERE id = $1', [id]);
            if (r.rows.length === 0)
                return res.status(404).json({ error: 'Jadwal PM tidak ditemukan.' });
            return res.json(rowToUpcomingPM(r.rows[0]));
        }
        params.push(id);
        await query(`UPDATE upcoming_pm SET ${updates.join(', ')} WHERE id = $${idx}`, params);
        const r = await query('SELECT * FROM upcoming_pm WHERE id = $1', [id]);
        if (r.rows.length === 0)
            return res.status(404).json({ error: 'Jadwal PM tidak ditemukan.' });
        res.json(rowToUpcomingPM(r.rows[0]));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal memperbarui jadwal PM' });
    }
});
dashboardRouter.delete('/dashboard/upcoming-pm/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM upcoming_pm WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'Jadwal PM tidak ditemukan.' });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menghapus jadwal PM' });
    }
});
dashboardRouter.post('/dashboard/pm-schedule', async (req, res) => {
    try {
        const body = req.body;
        const assetName = String(body.assetName ?? '').trim();
        const activity = String(body.activity ?? '').trim();
        const scheduledDate = String(body.scheduledDate ?? '').trim();
        const assignedTo = String(body.assignedTo ?? '').trim();
        if (!assetName)
            return res.status(400).json({ error: 'Asset Name wajib diisi.' });
        if (!activity)
            return res.status(400).json({ error: 'Activity wajib diisi.' });
        if (!scheduledDate)
            return res.status(400).json({ error: 'Scheduled PM Date wajib diisi.' });
        if (!assignedTo)
            return res.status(400).json({ error: 'Responsible Technician wajib diisi.' });
        const countResult = await query('SELECT COUNT(*)::int AS c FROM upcoming_pm');
        const nextNum = (countResult.rows[0]?.c ?? 0) + 1;
        const nextPmId = `PM${2400 + nextNum}`;
        const result = await query(`INSERT INTO upcoming_pm (pm_id, asset_name, activity, scheduled_date, assigned_to,
        asset_serial_number, asset_location, pm_type, pm_category, start_time, end_time, frequency, manpower,
        shift_schedule, required_equipment, spare_parts_list, detailed_instructions, procedural_doc_link,
        priority, pm_status, approval_status, reminder_enabled, warning_days, special_notes, feedback,
        manager_approval, audit_trail, photo_urls, report_generated, keterangan_status, keterangan_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
       RETURNING *`, [
            nextPmId,
            assetName,
            activity,
            scheduledDate,
            assignedTo,
            body.assetSerialNumber != null ? String(body.assetSerialNumber).trim() : null,
            body.assetLocation != null ? String(body.assetLocation).trim() : null,
            body.pmType != null ? String(body.pmType).trim() : null,
            body.pmCategory != null ? String(body.pmCategory).trim() : null,
            body.startTime != null ? String(body.startTime).trim() : null,
            body.endTime != null ? String(body.endTime).trim() : null,
            body.frequency != null ? String(body.frequency).trim() : null,
            typeof body.manpower === 'number' ? body.manpower : null,
            body.shiftSchedule != null ? String(body.shiftSchedule).trim() : null,
            body.requiredEquipment != null ? String(body.requiredEquipment).trim() : null,
            body.sparePartsList != null ? String(body.sparePartsList).trim() : null,
            body.detailedInstructions != null ? String(body.detailedInstructions).trim() : null,
            body.proceduralDocLink != null ? String(body.proceduralDocLink).trim() : null,
            body.priority != null ? String(body.priority).trim() : null,
            body.pmStatus != null ? String(body.pmStatus).trim() : null,
            body.approvalStatus != null ? String(body.approvalStatus).trim() : null,
            body.reminderEnabled === true,
            typeof body.warningDays === 'number' ? body.warningDays : null,
            body.specialNotes != null ? String(body.specialNotes).trim() : null,
            body.feedback != null ? String(body.feedback).trim() : null,
            body.managerApproval != null ? String(body.managerApproval).trim() : null,
            body.auditTrail != null ? String(body.auditTrail).trim() : null,
            body.photoUrls != null ? String(body.photoUrls).trim() : null,
            body.reportGenerated === true,
            body.keteranganStatus === 'PM OK' || body.keteranganStatus === 'Belum Selesai' || body.keteranganStatus === 'Pending' ? body.keteranganStatus : null,
            body.keteranganNotes != null ? String(body.keteranganNotes).trim() : null,
        ]);
        res.status(201).json(rowToUpcomingPM(result.rows[0]));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal membuat jadwal PM' });
    }
});
dashboardRouter.get('/dashboard/quick-stats', async (_, res) => {
    try {
        const completed = await query("SELECT COUNT(*)::text AS c FROM permintaan_perbaikan WHERE status = 'Completed'");
        res.json({
            avgResponseTimeHours: 0,
            completedWOs: parseInt(completed.rows[0]?.c ?? '0', 10),
            techniciansActive: 0,
            equipmentUptimePercent: 0,
            warningCount: 0,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil quick stats' });
    }
});
dashboardRouter.get('/dashboard/wo-status', async (_, res) => {
    try {
        const result = await query('SELECT status, COUNT(*)::text AS c FROM permintaan_perbaikan GROUP BY status');
        const m = {};
        result.rows.forEach((r) => { m[r.status] = parseInt(r.c, 10); });
        res.json({
            completed: m['Completed'] ?? 0,
            inProgress: m['In Progress'] ?? 0,
            pending: m['Pending'] ?? 0,
            open: (m['Open'] ?? 0) + (m['PM'] ?? 0),
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil distribusi status WO' });
    }
});
dashboardRouter.get('/dashboard/asset-health', async (_, res) => {
    try {
        const result = await query('SELECT health, COUNT(*)::text AS c FROM assets GROUP BY health');
        const m = {};
        result.rows.forEach((r) => { m[r.health] = parseInt(r.c, 10); });
        res.json({
            running: m['Running'] ?? 0,
            warning: m['Warning'] ?? 0,
            breakdown: m['Breakdown'] ?? 0,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil asset health' });
    }
});
