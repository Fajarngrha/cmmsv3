import { Router } from 'express';
import { mock } from '../data/mock.js';
import { isDbConfigured, query } from '../db/index.js';
export const purchaseOrdersRouter = Router();
function formatDate(d) {
    if (d instanceof Date)
        return d.toISOString().slice(0, 10);
    return String(d);
}
function rowToPo(row) {
    return {
        id: String(row.id),
        tanggal: formatDate(row.tanggal),
        itemDeskripsi: row.item_deskripsi,
        model: row.model ?? '',
        hargaPerUnit: Number(row.harga_per_unit),
        qty: row.qty,
        noRegistrasi: row.no_registrasi,
        noPO: row.no_po ?? '',
        mesin: row.mesin ?? '',
        noQuotation: row.no_quotation ?? '',
        supplier: row.supplier ?? '',
        kategori: row.kategori,
        totalHarga: Number(row.total_harga),
        status: row.status,
    };
}
async function nextNoRegistrasiFromDb() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = `MTC/SPB/${mm}/${yy}/`;
    const result = await query(`SELECT no_registrasi FROM purchase_orders WHERE no_registrasi LIKE $1 ORDER BY no_registrasi DESC LIMIT 1`, [`${prefix}%`]);
    let nextNum = 1;
    if (result.rows.length > 0) {
        const last = result.rows[0].no_registrasi;
        const numPart = last.slice(prefix.length);
        nextNum = (parseInt(numPart, 10) || 0) + 1;
    }
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}
function nextNoRegistrasiMock() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = `MTC/SPB/${mm}/${yy}/`;
    const existing = mock.purchaseOrders
        .filter((po) => po.noRegistrasi.startsWith(prefix))
        .map((po) => {
        const num = po.noRegistrasi.slice(prefix.length);
        return parseInt(num, 10) || 0;
    });
    const nextNum = existing.length === 0 ? 1 : Math.max(...existing) + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}
purchaseOrdersRouter.get('/purchase-orders', async (_, res) => {
    try {
        if (isDbConfigured()) {
            const result = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders ORDER BY id DESC`);
            return res.json(result.rows.map(rowToPo));
        }
        res.json(mock.purchaseOrders);
    }
    catch (err) {
        console.error('GET /purchase-orders', err);
        return res.status(500).json({ error: 'Gagal mengambil data PO.' });
    }
});
purchaseOrdersRouter.get('/purchase-orders/:id', async (req, res) => {
    const id = req.params.id;
    try {
        if (isDbConfigured()) {
            const result = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`, [id]);
            if (result.rows.length === 0)
                return res.status(404).json({ error: 'PO tidak ditemukan.' });
            return res.json(rowToPo(result.rows[0]));
        }
        const po = mock.purchaseOrders.find((p) => p.id === id);
        if (!po)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        res.json(po);
    }
    catch (err) {
        console.error('GET /purchase-orders/:id', err);
        return res.status(500).json({ error: 'Gagal mengambil data PO.' });
    }
});
purchaseOrdersRouter.patch('/purchase-orders/:id', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    const statusOptions = ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7'];
    try {
        if (isDbConfigured()) {
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
            if (body.status && statusOptions.includes(body.status)) {
                updates.push(`status = $${idx++}`);
                params.push(body.status);
            }
            if (updates.length === 0) {
                const r = await query(`SELECT id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status FROM purchase_orders WHERE id = $1`, [id]);
                if (r.rows.length === 0)
                    return res.status(404).json({ error: 'PO tidak ditemukan.' });
                return res.json(rowToPo(r.rows[0]));
            }
            params.push(id);
            const result = await query(`UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status`, params);
            if (result.rows.length === 0)
                return res.status(404).json({ error: 'PO tidak ditemukan.' });
            return res.json(rowToPo(result.rows[0]));
        }
        const po = mock.purchaseOrders.find((p) => p.id === id);
        if (!po)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        if (body.noPO !== undefined)
            po.noPO = String(body.noPO).trim();
        if (body.noQuotation !== undefined)
            po.noQuotation = String(body.noQuotation).trim();
        if (body.status && statusOptions.includes(body.status))
            po.status = body.status;
        res.json(po);
    }
    catch (err) {
        console.error('PATCH /purchase-orders/:id', err);
        return res.status(500).json({ error: 'Gagal memperbarui PO.' });
    }
});
purchaseOrdersRouter.post('/purchase-orders', async (req, res) => {
    const body = req.body;
    if (!body.tanggal?.trim()) {
        return res.status(400).json({ error: 'Tanggal wajib diisi.' });
    }
    if (!body.itemDeskripsi?.trim()) {
        return res.status(400).json({ error: 'Item Deskripsi wajib diisi.' });
    }
    const hargaPerUnit = typeof body.hargaPerUnit === 'number' ? body.hargaPerUnit : Number(body.hargaPerUnit) || 0;
    const qty = typeof body.qty === 'number' ? body.qty : Number(body.qty) || 0;
    const totalHarga = hargaPerUnit * qty;
    const kategoriOptions = ['Preventive', 'Sparepart', 'Breakdown/Repair'];
    const statusOptions = ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7'];
    const kategori = body.kategori && kategoriOptions.includes(body.kategori) ? body.kategori : 'Sparepart';
    const status = body.status && statusOptions.includes(body.status) ? body.status : 'Tahap 1';
    try {
        if (isDbConfigured()) {
            const noRegistrasi = await nextNoRegistrasiFromDb();
            const result = await query(`INSERT INTO purchase_orders (tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status)
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
            const row = result.rows[0];
            return res.status(201).json(rowToPo(row));
        }
        const noRegistrasi = nextNoRegistrasiMock();
        const id = String(mock.purchaseOrders.length + 1);
        const newPO = {
            id,
            tanggal: body.tanggal.trim(),
            itemDeskripsi: body.itemDeskripsi.trim(),
            model: (body.model ?? '').trim(),
            hargaPerUnit,
            qty,
            noRegistrasi,
            noPO: (body.noPO ?? '').trim(),
            mesin: (body.mesin ?? '').trim(),
            noQuotation: (body.noQuotation ?? '').trim(),
            supplier: (body.supplier ?? '').trim(),
            kategori,
            totalHarga,
            status,
        };
        mock.purchaseOrders.push(newPO);
        res.status(201).json(newPO);
    }
    catch (err) {
        console.error('POST /purchase-orders', err);
        return res.status(500).json({ error: 'Gagal menambah PO.' });
    }
});
purchaseOrdersRouter.delete('/purchase-orders/:id', async (req, res) => {
    const id = req.params.id;
    try {
        if (isDbConfigured()) {
            const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id]);
            if (result.rowCount === 0)
                return res.status(404).json({ error: 'PO tidak ditemukan.' });
            return res.status(204).send();
        }
        const idx = mock.purchaseOrders.findIndex((p) => p.id === id);
        if (idx === -1)
            return res.status(404).json({ error: 'PO tidak ditemukan.' });
        mock.purchaseOrders.splice(idx, 1);
        res.status(204).send();
    }
    catch (err) {
        console.error('DELETE /purchase-orders/:id', err);
        return res.status(500).json({ error: 'Gagal menghapus PO.' });
    }
});
