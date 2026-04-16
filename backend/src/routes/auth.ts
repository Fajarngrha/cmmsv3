import { Router } from 'express'
import { signAccessToken, verifyLogin } from '../auth.js'

export const authRouter = Router()

authRouter.post('/auth/login', async (req, res) => {
  try {
    const body = req.body as { username?: string; password?: string }
    const username = body.username?.trim() ?? ''
    const password = body.password ?? ''

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' })
    }

    const user = await verifyLogin(username, password)
    if (!user) return res.status(401).json({ error: 'Username atau password tidak valid.' })

    const token = signAccessToken(user)
    res.json({ token, user })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Terjadi kesalahan saat login.' })
  }
})
