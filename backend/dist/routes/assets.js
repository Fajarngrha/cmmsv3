import { Router } from 'express';
import { query } from '../db/index.js';
import { rowToAsset } from '../db/mappers.js';
export const assetsRouter = Router();
assetsRouter.get('/assets', async (_, res) => {
    try {
        const result = await query('SELECT * FROM assets ORDER BY id');
        res.json(result.rows.map((r) => rowToAsset(r)));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil data assets' });
    }
});
assetsRouter.post('/assets', async (req, res) => {
    try {
        const body = req.body;
        if (!body.name?.trim())
            return res.status(400).json({ error: 'Nama asset wajib diisi.' });
        if (!body.section?.trim())
            return res.status(400).json({ error: 'Section wajib diisi.' });
        const health = body.health && ['Running', 'Warning', 'Breakdown'].includes(body.health) ? body.health : 'Running';
        const countResult = await query('SELECT COUNT(*)::int AS c FROM assets');
        const nextNum = (countResult.rows[0]?.c ?? 0) + 1;
        const nextAssetId = body.assetId?.trim() || `AST-${String(nextNum).padStart(3, '0')}`;
        const today = new Date().toISOString().slice(0, 10);
        const result = await query(`INSERT INTO assets (asset_id, name, section, health, last_pm_date, next_pm_date, uptime_percent, installed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
            nextAssetId,
            body.name.trim(),
            body.section.trim(),
            health,
            body.lastPmDate?.trim() || today,
            body.nextPmDate?.trim() || today,
            typeof body.uptimePercent === 'number' ? body.uptimePercent : 100,
            body.installedAt?.trim() || null,
        ]);
        res.status(201).json(rowToAsset(result.rows[0]));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menambah asset' });
    }
});
assetsRouter.post('/assets/import', async (req, res) => {
    try {
        const body = req.body;
        const list = Array.isArray(body?.assets) ? body.assets : [];
        if (list.length === 0)
            return res.status(400).json({ error: 'Data assets kosong. Kirim array assets.' });
        const today = new Date().toISOString().slice(0, 10);
        const created = [];
        let countResult = await query('SELECT COUNT(*)::int AS c FROM assets');
        let nextNum = (countResult.rows[0]?.c ?? 0);
        for (const row of list) {
            if (!row.name?.trim() || !row.section?.trim())
                continue;
            nextNum += 1;
            const health = row.health && ['Running', 'Warning', 'Breakdown'].includes(row.health) ? row.health : 'Running';
            const nextAssetId = row.assetId?.trim() || `AST-${String(nextNum).padStart(3, '0')}`;
            const result = await query(`INSERT INTO assets (asset_id, name, section, health, last_pm_date, next_pm_date, uptime_percent, installed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [
                nextAssetId,
                row.name.trim(),
                row.section.trim(),
                health,
                row.lastPmDate?.trim() || today,
                row.nextPmDate?.trim() || today,
                typeof row.uptimePercent === 'number' ? row.uptimePercent : 100,
                row.installedAt?.trim() || null,
            ]);
            created.push(rowToAsset(result.rows[0]));
        }
        res.status(201).json({ imported: created.length, assets: created });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengimpor assets' });
    }
});
assetsRouter.delete('/assets/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM assets WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'Asset tidak ditemukan.' });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menghapus asset' });
    }
});
