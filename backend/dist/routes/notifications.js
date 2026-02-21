import { Router } from 'express';
import { query } from '../db/index.js';
export const notificationsRouter = Router();
function rowToNotification(row) {
    return {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body ?? '',
        relatedEntity: row.related_entity ?? undefined,
        relatedId: row.related_id ?? undefined,
        readAt: row.read_at ?? undefined,
        createdAt: row.created_at,
    };
}
/** GET /api/notifications - list notifikasi (unreadOnly, limit) */
notificationsRouter.get('/notifications', async (req, res) => {
    try {
        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        let sql = 'SELECT id, type, title, body, related_entity, related_id, read_at, created_at FROM notifications';
        const params = [];
        if (unreadOnly) {
            sql += ' WHERE read_at IS NULL';
        }
        sql += ' ORDER BY created_at DESC LIMIT $1';
        params.push(limit);
        const result = await query(sql, params);
        res.json(result.rows.map(rowToNotification));
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil notifikasi' });
    }
});
/** GET /api/notifications/unread-count - jumlah belum dibaca */
notificationsRouter.get('/notifications/unread-count', async (_, res) => {
    try {
        const result = await query('SELECT COUNT(*)::text AS count FROM notifications WHERE read_at IS NULL');
        res.json({ count: Number(result.rows[0]?.count ?? 0) });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal mengambil jumlah notifikasi' });
    }
});
/** PATCH /api/notifications/:id/read - tandai sudah dibaca */
notificationsRouter.patch('/notifications/:id/read', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND read_at IS NULL RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notifikasi tidak ditemukan atau sudah dibaca' });
        }
        res.json({ id: Number(id), read: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menandai notifikasi' });
    }
});
/** PATCH /api/notifications/read-all - tandai semua dibaca */
notificationsRouter.patch('/notifications/read-all', async (_, res) => {
    try {
        const result = await query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL RETURNING id');
        res.json({ updated: result.rowCount ?? 0 });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menandai notifikasi' });
    }
});
