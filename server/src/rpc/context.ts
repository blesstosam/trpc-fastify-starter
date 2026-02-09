import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import type { JwtPayload } from '../lib/auth'
import { verifyJwt } from '../lib/auth'
import { prisma } from '../lib/prisma'

export interface AuthUser {
  id: string
  userId: number
  username: string
  fullName: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  superAdmin: number
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
      userId: true,
      username: true,
      fullName: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      superAdmin: true,
    },
  })
  if (!user) {
    return null
  }

  return {
    ...user,
    id: user.id.toString(),
  }
}

export async function createContext(opts: CreateFastifyContextOptions) {
  const token = parseBearerToken(opts.req.headers.authorization)
  const payload = token ? verifyJwt(token) : null
  const user = await resolveCurrentUser(payload)

  return {
    req: opts.req,
    res: opts.res,
    user,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
