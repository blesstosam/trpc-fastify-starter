import { createHash } from 'node:crypto'

export interface JwtPayload {
  sub: string
  username: string
  userId: number
  superAdmin: number
}

export interface SignJwtInput extends JwtPayload {}

export const JWT_ALGORITHM = 'HS256'
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'trpc-demo-dev-secret'
}

export const jwtSignOptions = {
  algorithm: JWT_ALGORITHM,
  expiresIn: JWT_EXPIRES_IN_SECONDS,
} as const

export function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}
