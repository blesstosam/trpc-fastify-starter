import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import type { JwtPayload } from '../lib/auth'
import { prisma } from '../lib/prisma'

export interface AuthUser {
  id: bigint
  username: string
  fullName: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  state: number
}

function parseBearerToken(authHeader: string | string[] | undefined) {
  if (!authHeader || Array.isArray(authHeader)) {
    return null
  }
  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) {
    return null
  }
  return token
}

async function resolveCurrentUser(payload: JwtPayload | null): Promise<AuthUser | null> {
  if (!payload) {
    return null
  }

  let userId: bigint
  try {
    userId = BigInt(payload.sub)
  }
  catch {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      state: true,
    },
  })
  if (!user) {
    return null
  }

  return {
    ...user,
    id: user.id,
  }
}

export async function createContext(opts: CreateFastifyContextOptions) {
  const token = parseBearerToken(opts.req.headers.authorization)
  const payload = token ? verifyToken(opts, token) : null
  const user = await resolveCurrentUser(payload)

  return {
    req: opts.req,
    res: opts.res,
    user,
    prisma,
  }
}

function verifyToken(opts: CreateFastifyContextOptions, token: string): JwtPayload | null {
  try {
    const jwt = (opts.req.server as typeof opts.req.server & {
      jwt: {
        verify: <T>(jwtToken: string) => T
      }
    }).jwt

    const payload = jwt.verify<JwtPayload>(token)
    if (
      typeof payload.sub !== 'string'
      || typeof payload.username !== 'string'
      || typeof payload.state !== 'number'
    ) {
      return null
    }
    return payload
  }
  catch {
    return null
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
