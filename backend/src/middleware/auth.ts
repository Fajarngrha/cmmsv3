import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../auth.js'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isLoginRoute = req.path === '/auth/login'
  const isHealthRoute = req.path === '/health'
  const isPublicAssetHistoryRoute = /^\/assets\/[^/]+\/history$/.test(req.path)

  if (isLoginRoute || isHealthRoute || isPublicAssetHistoryRoute) {
    next()
    return
  }

  const authorization = req.headers.authorization ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    res.status(401).json({ error: 'Unauthorized. Token tidak ditemukan.' })
    return
  }

  const user = verifyAccessToken(token)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized. Token tidak valid atau kedaluwarsa.' })
    return
  }

  next()
}
