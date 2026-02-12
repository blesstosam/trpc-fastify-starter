import type { CreateTagInput, TagListInput, UpdateTagInput } from './dto'
import { TRPCError } from '@trpc/server'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'

const tagSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const

interface TagRow {
  id: bigint
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

function toSnowflakeId(id: string) {
  return BigInt(id)
}

function serializeTag(tag: TagRow) {
  return { ...tag, id: tag.id.toString() }
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

  throw new TRPCError({ code: 'CONFLICT', message: 'Tag 名称已存在' })
}

export async function listTags(input: TagListInput) {
  const keyword = input?.keyword
  const where = keyword
    ? { name: { contains: keyword } }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: tagSelect,
    }),
    prisma.tag.count({ where }),
  ])

  return { items: items.map(serializeTag), total }
}

export async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: toSnowflakeId(id) },
    select: tagSelect,
  })

  if (!tag) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag 不存在或已删除' })
  }

  return serializeTag(tag)
}

export async function createTag(input: CreateTagInput) {
  const name = input.name.trim()
  const description = input.description?.trim() ?? ''

  await assertTagNameAvailable(name)

  const tag = await prisma.tag.create({
    data: {
      id: nextSnowflakeId(),
      name,
      description,
      updatedAt: new Date(),
    },
    select: tagSelect,
  })
  return serializeTag(tag)
}

export async function updateTag(input: UpdateTagInput) {
  await getTagById(input.id)
  const name = input.name.trim()
  const description = input.description?.trim() ?? ''

  await assertTagNameAvailable(name, input.id)

  const tag = await prisma.tag.update({
    where: { id: toSnowflakeId(input.id) },
    data: {
      name,
      description,
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
