import type { CreateTagInput, TagListInput, UpdateTagInput } from './dto'
import { TRPCError } from '@trpc/server'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'

const userSelect = {
  id: true,
  username: true,
  fullName: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  state: true,
} as const

const tagSelect = {
  id: true,
  name: true,
  description: true,
  createdByUser: { select: userSelect },
  updatedByUser: { select: userSelect },
  ownerUser: { select: userSelect },
  createdAt: true,
  updatedAt: true,
} as const

interface UserRow {
  id: bigint
  username: string
  fullName: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  state: number
}

interface TagRow {
  id: bigint
  name: string
  description: string | null
  createdByUser: UserRow | null
  updatedByUser: UserRow | null
  ownerUser: UserRow | null
  createdAt: Date
  updatedAt: Date
}

function toSnowflakeId(id: string) {
  return BigInt(id)
}

function serializeUser(user: UserRow | null) {
  if (!user)
    return null
  return {
    ...user,
    id: user.id.toString(),
  }
}

function serializeTag(tag: TagRow) {
  return {
    id: tag.id.toString(),
    name: tag.name,
    description: tag.description,
    createdBy: serializeUser(tag.createdByUser),
    updatedBy: serializeUser(tag.updatedByUser),
    owner: serializeUser(tag.ownerUser),
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }
}

async function assertTagNameAvailable(name: string, currentId?: string) {
  const existing = await prisma.tag.findUnique({
    where: { name },
    select: { id: true },
  })

  if (!existing) {
    return
  }

  if (currentId && existing.id.toString() === currentId) {
    return
  }

  throw new TRPCError({ code: 'CONFLICT', message: '标签名称已存在' })
}

export async function listTags(input: TagListInput) {
  const page = input?.page ?? 1
  const pageSize = input?.pageSize ?? 20
  const keyword = input?.keyword
  const where = keyword
    ? { name: { contains: keyword } }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: tagSelect,
    }),
    prisma.tag.count({ where }),
  ])

  return {
    items: items.map(serializeTag),
    total,
    page,
    pageSize,
  }
}

export async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: toSnowflakeId(id) },
    select: tagSelect,
  })

  if (!tag) {
    throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在或已删除' })
  }

  return serializeTag(tag)
}

export async function createTag(input: CreateTagInput, operatorId: string) {
  const name = input.name.trim()
  const description = input.description?.trim() ?? ''
  const operator = toSnowflakeId(operatorId)

  await assertTagNameAvailable(name)

  const tag = await prisma.tag.create({
    data: {
      id: nextSnowflakeId(),
      name,
      description,
      createdBy: operator,
      updatedBy: operator,
      owner: operator,
      updatedAt: new Date(),
    },
    select: tagSelect,
  })
  return serializeTag(tag)
}

export async function updateTag(input: UpdateTagInput, operatorId: string) {
  const existingTag = await getTagById(input.id)
  const name = input.name?.trim() ?? existingTag.name
  const description = input.description === undefined
    ? (existingTag.description ?? '')
    : input.description.trim()
  const operator = toSnowflakeId(operatorId)

  await assertTagNameAvailable(name, input.id)

  const tag = await prisma.tag.update({
    where: { id: toSnowflakeId(input.id) },
    data: {
      name,
      description,
      updatedBy: operator,
      updatedAt: new Date(),
    },
    select: tagSelect,
  })
  return serializeTag(tag)
}

export async function deleteTag(id: string) {
  await getTagById(id)
  await prisma.tag.delete({ where: { id: toSnowflakeId(id) } })
  return { success: true as const }
}
