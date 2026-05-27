import { TRPCError } from '@trpc/server'
import { verifyPassword } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { serializeUser } from '../user/dto'

const numericAccountRegex = /^\d+$/

const authUserSelect = {
  id: true,
  username: true,
  fullName: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  state: true,
  password: true,
} as const

async function getUserByAccount(account: string) {
  const whereOr: Array<{ username: string } | { id: bigint }> = [{ username: account }]
  if (numericAccountRegex.test(account)) {
    whereOr.push({ id: BigInt(account) })
  }

  return prisma.user.findFirst({
    where: {
      OR: whereOr,
    },
    select: authUserSelect,
  })
}

export async function loginByPassword(account: string, password: string) {
  const user = await getUserByAccount(account)
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid account or password' })
  }

  const passwordMatched = await verifyPassword(password, user.password)
  if (!passwordMatched) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid account or password' })
  }

  return serializeUser(user)
}
