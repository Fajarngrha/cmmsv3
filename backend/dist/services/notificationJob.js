/**
 * Job reminder: buat notifikasi in-app + kirim email/WhatsApp (jika dikonfig).
 * Jenis: PO tahap berikutnya, PM mendatang, WO open baru, WO overdue.
 */
import { query } from '../db/index.js';
const NOTIFICATION_TYPES = {
    po_next_stage: 'po_next_stage',
    pm_upcoming: 'pm_upcoming',
    wo_new: 'wo_new',
    wo_overdue: 'wo_overdue',
};
const DEDUPE_HOURS = 24;
const PM_UPCOMING_DAYS = 7;
const WO_NEW_HOURS = 24;
async function alreadyNotifiedRecently(type, relatedEntity, relatedId) {
    const result = await query(`SELECT id FROM notifications
     WHERE type = $1 AND related_entity = $2 AND related_id = $3
       AND created_at > NOW() - INTERVAL '1 hour' * $4
     LIMIT 1`, [type, relatedEntity, relatedId, DEDUPE_HOURS]);
    return result.rows.length > 0;
}
async function insertNotification(type, title, body, relatedEntity, relatedId) {
    const exists = await alreadyNotifiedRecently(type, relatedEntity, relatedId);
    if (exists)
        return null;
    const result = await query(`INSERT INTO notifications (type, title, body, related_entity, related_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`, [type, title, body, relatedEntity, relatedId]);
    return result.rows[0]?.id ?? null;
}
/** PO yang belum Tahap 7 → reminder tahap berikutnya */
async function checkPoNextStage() {
    const result = await query(`SELECT id, no_registrasi, status FROM purchase_orders WHERE status <> 'Tahap 7' ORDER BY id`);
    for (const row of result.rows) {
        const id = await insertNotification(NOTIFICATION_TYPES.po_next_stage, `PO ${row.no_registrasi} – lanjut ke tahap berikutnya`, `PO ${row.no_registrasi} saat ini di ${row.status}. Silakan proses ke tahap berikutnya.`, 'purchase_orders', String(row.id));
        if (id)
            await sendChannels(id, `PO ${row.no_registrasi} perlu diproses ke tahap berikutnya (${row.status}).`);
    }
}
/** PM dengan scheduled_date dalam N hari ke depan */
async function checkPmUpcoming() {
    const result = await query(`SELECT id, pm_id, asset_name, activity, scheduled_date
     FROM upcoming_pm
     WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
     ORDER BY scheduled_date`, [PM_UPCOMING_DAYS]);
    for (const row of result.rows) {
        const id = await insertNotification(NOTIFICATION_TYPES.pm_upcoming, `PM mendatang: ${row.pm_id} – ${row.asset_name}`, `${row.activity} dijadwalkan ${row.scheduled_date}.`, 'upcoming_pm', String(row.id));
        if (id)
            await sendChannels(id, `PM ${row.pm_id} (${row.asset_name}) mendatang pada ${row.scheduled_date}.`);
    }
}
/** WO status Open yang dibuat dalam 24 jam terakhir */
async function checkWoNew() {
    const result = await query(`SELECT id, wo_id, machine_name, created_at
     FROM permintaan_perbaikan
     WHERE status = 'Open' AND created_at > NOW() - INTERVAL '1 hour' * $1
     ORDER BY created_at DESC`, [WO_NEW_HOURS]);
    for (const row of result.rows) {
        const id = await insertNotification(NOTIFICATION_TYPES.wo_new, `WO open baru: ${row.wo_id}`, `Permintaan perbaikan ${row.wo_id} (${row.machine_name}) baru masuk.`, 'permintaan_perbaikan', String(row.id));
        if (id)
            await sendChannels(id, `WO open baru: ${row.wo_id} – ${row.machine_name}.`);
    }
}
/** WO overdue: due_date < today dan status bukan Completed */
async function checkWoOverdue() {
    const result = await query(`SELECT id, wo_id, machine_name, due_date
     FROM permintaan_perbaikan
     WHERE status IN ('Open', 'Pending', 'In Progress') AND due_date < CURRENT_DATE
     ORDER BY due_date`);
    for (const row of result.rows) {
        const id = await insertNotification(NOTIFICATION_TYPES.wo_overdue, `WO overdue: ${row.wo_id}`, `WO ${row.wo_id} (${row.machine_name}) melewati batas due date ${row.due_date}.`, 'permintaan_perbaikan', String(row.id));
        if (id)
            await sendChannels(id, `WO overdue: ${row.wo_id} – ${row.machine_name} (due ${row.due_date}).`);
    }
}
/** Kirim ke email/WhatsApp dan log ke notification_sent */
async function sendChannels(notificationId, text) {
    const toEmail = process.env.NOTIFICATION_EMAIL_TO;
    const toWhatsApp = process.env.NOTIFICATION_WHATSAPP_TO;
    if (toEmail) {
        try {
            const sent = await sendEmail(toEmail, `[CMMS] Notifikasi`, text);
            if (sent)
                await logSent(notificationId, 'email', toEmail);
        }
        catch (e) {
            console.error('[notificationJob] Email gagal:', e);
        }
    }
    if (toWhatsApp) {
        try {
            const sent = await sendWhatsApp(toWhatsApp, text);
            if (sent)
                await logSent(notificationId, 'whatsapp', toWhatsApp);
        }
        catch (e) {
            console.error('[notificationJob] WhatsApp gagal:', e);
        }
    }
}
async function logSent(notificationId, channel, sentTo) {
    await query('INSERT INTO notification_sent (notification_id, channel, sent_to) VALUES ($1, $2, $3)', [notificationId, channel, sentTo]);
}
async function sendEmail(to, subject, text) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass)
        return false;
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || user,
        to,
        subject,
        text,
    });
    return true;
}
async function sendWhatsApp(to, text) {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;
    if (!apiUrl || !apiKey)
        return false;
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ to: to.replace(/\D/g, ''), text }),
    });
    return res.ok;
}
export async function runNotificationJob() {
    try {
        await checkPoNextStage();
        await checkPmUpcoming();
        await checkWoNew();
        await checkWoOverdue();
    }
    catch (e) {
        console.error('[notificationJob] Error:', e);
    }
}
const INTERVAL_MS = 15 * 60 * 1000;
export function startNotificationScheduler() {
    runNotificationJob();
    setInterval(runNotificationJob, INTERVAL_MS);
    console.log('[notificationJob] Scheduler started (setiap 15 menit)');
}
