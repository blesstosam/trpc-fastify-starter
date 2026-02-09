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

export async function listTags(input: TagListInput) {
  const page = input?.page ?? 1
  const pageSize = input?.pageSize ?? 10
  const keyword = input?.keyword
  const where = keyword
    ? {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.tag.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      select: tagSelect,
    }),
    prisma.tag.count({ where }),
  ])

  return { items: items.map(serializeTag), total, page, pageSize }
}

export async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: toSnowflakeId(id) },
    select: tagSelect,
  })

  if (!tag) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found' })
  }

  return serializeTag(tag)
}

export async function createTag(input: CreateTagInput) {
  const tag = await prisma.tag.create({
    data: {
      id: nextSnowflakeId(),
      name: input.name,
      description: input.description ?? null,
      updatedAt: new Date(),
    },
    select: tagSelect,
  })
  return serializeTag(tag)
}

export async function updateTag(input: UpdateTagInput) {
  await getTagById(input.id)
  const { id, ...rest } = input

  const tag = await prisma.tag.update({
    where: { id: toSnowflakeId(id) },
    data: {
      ...rest,
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
