import type { JwtPayload as JwtLibraryPayload } from 'jsonwebtoken'
import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'

interface JwtPayload extends JwtLibraryPayload {
  sub: string
  username: string
  userId: number
  superAdmin: number
}

interface SignJwtInput {
  sub: string
  username: string
  userId: number
  superAdmin: number
}

const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

function getJwtSecret() {
  return process.env.JWT_SECRET || 'trpc-demo-dev-secret'
}

export function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

export function signJwt(input: SignJwtInput) {
  const payload = {
    ...input,
  }
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  })
}

export function verifyJwt(token: string) {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
    })
    if (!payload || typeof payload === 'string') {
      return null
    }

    if (
      typeof payload.sub !== 'string'
      || typeof payload.username !== 'string'
      || typeof payload.userId !== 'number'
      || typeof payload.superAdmin !== 'number'
    ) {
      return null
    }
    return payload as JwtPayload
  }
  catch {
    return null
  }
}

export type { JwtPayload }
