/**
 * Server-only utility for signing/verifying teacher signature tokens.
 * Uses HMAC-SHA256 with AUTH_SECRET as the key.
 * Do NOT import this file from client components.
 */
import crypto from 'crypto'

export interface SignaturePayload {
  /** Teacher user ID */
  sub: string
  /** Weekly report ID */
  rid: string
  /** Unix timestamp (seconds) when the token was issued */
  iat: number
}

export function signToken(payload: SignaturePayload): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token: string): SignaturePayload | null {
  try {
    const secret = process.env.AUTH_SECRET
    if (!secret) return null
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx < 1) return null
    const body = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)
    if (!body || !sig) return null
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
    const sigBuf = Buffer.from(sig, 'base64url')
    const expBuf = Buffer.from(expected, 'base64url')
    if (sigBuf.length !== expBuf.length) return null
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SignaturePayload
  } catch {
    return null
  }
}
