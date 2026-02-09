import type { CreateUserInput, UpdateUserInput, UserListInput } from './dto'
import { TRPCError } from '@trpc/server'
import { hashPassword } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'

const userSelect = {
  id: true,
  userId: true,
  username: true,
  fullName: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  superAdmin: true,
} as const

interface UserRow {
  id: bigint
  userId: number
  username: string
  fullName: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  superAdmin: number
}

function toSnowflakeId(id: string) {
  return BigInt(id)
}

function serializeUser(user: UserRow) {
  return { ...user, id: user.id.toString() }
}

export async function listUsers(input: UserListInput) {
  const page = input?.page ?? 1
  const pageSize = input?.pageSize ?? 10
  const keyword = input?.keyword
  const where = keyword
    ? {
        OR: [{ username: { contains: keyword } }, { fullName: { contains: keyword } }],
      }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ])

  return { items: items.map(serializeUser), total, page, pageSize }
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id: toSnowflakeId(id) },
    select: userSelect,
  })

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
  }
  return serializeUser(user)
}

export async function createUser(input: CreateUserInput) {
  const user = await prisma.user.create({
    data: {
      id: nextSnowflakeId(),
      userId: input.userId,
      username: input.username,
      fullName: input.fullName ?? null,
      avatar: input.avatar ?? null,
      password: hashPassword(input.password),
      superAdmin: input.superAdmin ? 1 : 0,
      updatedAt: new Date(),
    },
    select: userSelect,
  })
  return serializeUser(user)
}

export async function updateUser(input: UpdateUserInput) {
  await getUserById(input.id)
  const { id, superAdmin, ...rest } = input

  const user = await prisma.user.update({
    where: { id: toSnowflakeId(id) },
    data: {
      ...rest,
      ...(rest.password ? { password: hashPassword(rest.password) } : {}),
      ...(superAdmin === undefined ? {} : { superAdmin: superAdmin ? 1 : 0 }),
      updatedAt: new Date(),
    },
    select: userSelect,
  })
  return serializeUser(user)
}

export async function deleteUser(id: string) {
  await getUserById(id)
  await prisma.user.delete({ where: { id: toSnowflakeId(id) } })
  return { success: true as const }
}
