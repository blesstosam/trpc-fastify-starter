import { hash, verify } from '@node-rs/argon2'

export interface JwtPayload {
  sub: string
  username: string
  state: number
}

export interface SignJwtInput extends JwtPayload {}

export const JWT_ALGORITHM = 'HS256'
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

export const ARGON2_OPTIONS = {
  algorithm: 2,
} as const

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'trpc-demo-dev-secret'
}

export const jwtSignOptions = {
  algorithm: JWT_ALGORITHM,
  expiresIn: JWT_EXPIRES_IN_SECONDS,
} as const

export async function hashPassword(password: string) {
  return hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return verify(passwordHash, password, ARGON2_OPTIONS)
}
