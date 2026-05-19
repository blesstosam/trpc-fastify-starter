import type { CreateUserInput, UpdateUserInput, UserListInput } from './dto'
import { TRPCError } from '@trpc/server'
import { hashPassword } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'
import { serializeUser } from './dto'

export async function listUsers(input: UserListInput) {
  const page = input.page
  const pageSize = input.pageSize
  const keyword = input?.keyword
  const where = keyword
    ? {
        OR: [{ username: { contains: keyword } }, { fullName: { contains: keyword } }],
      }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: input.skip,
      take: pageSize,
      orderBy: { id: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return { items: items.map(serializeUser), total, page, pageSize }
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(id) },
  })

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' })
  }
  return serializeUser(user)
}

export async function createUser(input: CreateUserInput) {
  const { password, ...data } = input
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      ...data,
      id: nextSnowflakeId(),
      password: passwordHash,
    },
  })
  return serializeUser(user)
}

export async function updateUser(input: UpdateUserInput) {
  const { id, password, ...data } = input
  const passwordHash = password ? await hashPassword(password) : undefined

  const user = await prisma.user.update({
    where: { id: BigInt(id) },
    data: {
      ...data,
      ...(passwordHash ? { password: passwordHash } : {}),
    },
  })
  return serializeUser(user)
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id: BigInt(id) } })
  return { success: true as const }
}
