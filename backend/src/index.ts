import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load .env dari folder backend (bukan cwd) agar jalan benar saat dijalankan PM2
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import { dashboardRouter } from './routes/dashboard.js'
import { permintaanPerbaikanRouter } from './routes/permintaanPerbaikan.js'
import { assetsRouter } from './routes/assets.js'
import { inventoryRouter } from './routes/inventory.js'
import { purchaseOrdersRouter } from './routes/purchaseOrders.js'
import { query, getConnectionInfo } from './db/index.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())
app.use('/api', dashboardRouter)
app.use('/api', permintaanPerbaikanRouter)
app.use('/api', assetsRouter)
app.use('/api', inventoryRouter)
app.use('/api', purchaseOrdersRouter)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

const staticDir =
  process.env.STATIC_DIR ||
  path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir))
  app.get('*', (_, res) => res.sendFile(path.join(staticDir, 'index.html')))
}

async function start() {
  try {
    await query('SELECT 1')
    console.log('Database: connected as', getConnectionInfo())
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string }
    console.error('Database connection failed. Set DATABASE_URL or DB_* env vars and ensure PostgreSQL is running.')
    console.error('Error code:', err?.code ?? 'unknown')
    console.error('Error message:', err?.message ?? String(e))
    if (err?.code) console.error('(PostgreSQL code', err.code, err.code === '42501' ? '= permission denied — jalankan grant-permissions-cmms_dbv3.sql)' : ')')
    process.exit(1)
  }
  app.listen(PORT, HOST, () => {
    console.log(`CMMS API: http://localhost:${PORT}`)
    if (fs.existsSync(staticDir)) {
      console.log('  Frontend static: dilayani dari', staticDir)
    }
    if (HOST === '0.0.0.0') {
      console.log('  Dapat diakses dari jaringan (WiFi) yang sama via IP komputer ini.')
    }
  })
}

process.on('uncaughtException', (e) => {
  console.error('Uncaught exception:', (e as Error).message)
  console.error((e as Error).stack)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

start()
