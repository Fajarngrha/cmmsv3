import { Router } from 'express';
import { query, getPool } from '../db/index.js';
import { rowToPurchaseOrder } from '../db/mappers.js';
export const purchaseOrdersRouter = Router();
const STATUS_OPTIONS = ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7'];
purchaseOrdersRouter.get('/purchase-orders', async (_, res) => {
    try {
        const result = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders ORDER BY id DESC`);
        res.json(result.rows.map((r) => rowToPurchaseOrder(r)));
    }
    catch (err) {
        console.error('GET /purchase-orders', err);
        res.status(500).json({ error: 'Gagal mengambil data PO.' });
    }
});
purchaseOrdersRouter.get('/purchase-orders/:id', async (req, res) => {
    try {
        const result = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        res.json(rowToPurchaseOrder(result.rows[0]));
    }
    catch (err) {
        console.error('GET /purchase-orders/:id', err);
        res.status(500).json({ error: 'Gagal mengambil data PO.' });
    }
});
purchaseOrdersRouter.patch('/purchase-orders/:id', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    try {
        const updates = [];
        const params = [];
        let idx = 1;
        if (body.noPO !== undefined) {
            updates.push(`no_po = $${idx++}`);
            params.push(String(body.noPO).trim());
        }
        if (body.noQuotation !== undefined) {
            updates.push(`no_quotation = $${idx++}`);
            params.push(String(body.noQuotation).trim());
        }
        if (body.status && STATUS_OPTIONS.includes(body.status)) {
            updates.push(`status = $${idx++}`);
            params.push(body.status);
        }
        if (updates.length === 0) {
            const r = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`, [id]);
            if (r.rows.length === 0)
                return res.status(404).json({ error: 'PO tidak ditemukan.' });
            return res.json(rowToPurchaseOrder(r.rows[0]));
        }
        params.push(id);
        const result = await query(`UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status`, params);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        res.json(rowToPurchaseOrder(result.rows[0]));
    }
    catch (err) {
        console.error('PATCH /purchase-orders/:id', err);
        res.status(500).json({ error: 'Gagal memperbarui PO.' });
    }
});
purchaseOrdersRouter.post('/purchase-orders', async (req, res) => {
    const body = req.body;
    if (!body.tanggal?.trim())
        return res.status(400).json({ error: 'Tanggal wajib diisi.' });
    if (!body.itemDeskripsi?.trim())
        return res.status(400).json({ error: 'Item Deskripsi wajib diisi.' });
    const hargaPerUnit = typeof body.hargaPerUnit === 'number' ? body.hargaPerUnit : Number(body.hargaPerUnit) || 0;
    const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty) || 0;
    const totalHarga = hargaPerUnit * qty;
    const kategoriOptions = ['Preventive', 'Sparepart', 'Breakdown/Repair'];
    const kategori = body.kategori && kategoriOptions.includes(body.kategori) ? body.kategori : 'Sparepart';
    const status = body.status && STATUS_OPTIONS.includes(body.status) ? body.status : 'Tahap 1';
    const maxRetries = 5;
    const retryDelayMs = 250;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const client = await getPool().connect();
        try {
            await client.query('BEGIN');
            await client.query('LOCK TABLE purchase_orders IN EXCLUSIVE MODE');
            const now = new Date();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yy = String(now.getFullYear()).slice(-2);
            const prefix = `MTC/SPB/${mm}/${yy}/`;
            const sel = await client.query(`SELECT no_registrasi FROM purchase_orders WHERE no_registrasi LIKE $1 ORDER BY no_registrasi DESC LIMIT 1`, [`${prefix}%`]);
            let maxNum = 0;
            if (sel.rows.length > 0) {
                const n = parseInt(sel.rows[0].no_registrasi.slice(prefix.length), 10);
                if (!Number.isNaN(n))
                    maxNum = n;
            }
            const nextNum = maxNum + 1;
            const noRegistrasi = `${prefix}${String(nextNum).padStart(4, '0')}`;
            const result = await client.query(`INSERT INTO purchase_orders (tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status`, [
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
            ]);
            await client.query('COMMIT');
            client.release();
            return res.status(201).json(rowToPurchaseOrder(result.rows[0]));
        }
        catch (err) {
            await client.query('ROLLBACK').catch(() => { });
            client.release();
            const code = err?.code;
            if (code === '23505' && attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, retryDelayMs));
                continue;
            }
            if (code === '23505') {
                console.error('POST /purchase-orders: duplicate no_registrasi after retries', err);
                return res.status(409).json({
                    error: 'Nomor registrasi bentrok. Silakan coba lagi.',
                    code: 'DUPLICATE_NO_REGISTRASI',
                });
            }
            console.error('POST /purchase-orders', err);
            return res.status(500).json({ error: 'Gagal menambah PO.' });
        }
    }
    return res.status(500).json({ error: 'Gagal menambah PO setelah beberapa percobaan.' });
});
purchaseOrdersRouter.delete('/purchase-orders/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        res.status(204).send();
    }
    catch (err) {
        console.error('DELETE /purchase-orders', err);
        res.status(500).json({ error: 'Gagal menghapus PO.' });
    }
});
