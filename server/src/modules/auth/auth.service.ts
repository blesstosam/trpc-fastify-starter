import { TRPCError } from '@trpc/server'
import { hashPassword } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

const authUserSelect = {
  id: true,
  userId: true,
  username: true,
  fullName: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  superAdmin: true,
  password: true,
} as const

type AuthUserRow = Awaited<ReturnType<typeof getUserByAccount>>

async function getUserByAccount(account: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username: account }, { userId: Number(account) || -1 }],
    },
    select: authUserSelect,
  })
}

function serializeUser(user: NonNullable<AuthUserRow>) {
  return {
    id: user.id.toString(),
    userId: user.userId,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    superAdmin: user.superAdmin,
  }
}

export async function loginByPassword(account: string, password: string) {
  const user = await getUserByAccount(account)
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid account or password' })
  }

  const encrypted = hashPassword(password)
  const passwordMatched = encrypted === user.password || password === user.password
  if (!passwordMatched) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid account or password' })
  }

  if (password === user.password) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: encrypted, updatedAt: new Date() },
    })
  }

  return serializeUser(user)
}
