import type { TagDefaultArgs, TagGetPayload } from '../../generated/prisma/models/Tag'
import type { CreateTagInput, TagListInput, UpdateTagInput } from './dto'
import { TRPCError } from '@trpc/server'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'
import { serializeUserWithNull } from '../user/dto'

const tagArgs = {
  include: {
    createdByUser: true,
    updatedByUser: true,
    ownerUser: true,
  },
} satisfies TagDefaultArgs

type TagPayload = TagGetPayload<typeof tagArgs>

function serializeTag(tag: TagPayload) {
  return {
    id: tag.id.toString(),
    name: tag.name,
    description: tag.description,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    createdBy: serializeUserWithNull(tag.createdByUser),
    updatedBy: serializeUserWithNull(tag.updatedByUser),
    owner: serializeUserWithNull(tag.ownerUser),
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
  const page = input.page
  const pageSize = input.pageSize
  const keyword = input?.keyword
  const where = keyword
    ? { name: { contains: keyword } }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: pageSize,
      ...tagArgs,
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
    where: { id: BigInt(id) },
    ...tagArgs,
  })

  if (!tag) {
    throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在或已删除' })
  }

  return serializeTag(tag)
}

export async function createTag(input: CreateTagInput, operatorId: bigint) {
  await assertTagNameAvailable(input.name)

  const tag = await prisma.tag.create({
    data: {
      ...input,
      description: input.description ?? '',
      id: nextSnowflakeId(),
      createdBy: operatorId,
      updatedBy: operatorId,
      owner: operatorId,
    },
    ...tagArgs,
  })
  return serializeTag(tag)
}

export async function updateTag(input: UpdateTagInput, operatorId: bigint) {
  const { id, ...data } = input
  if (data.name !== undefined) {
    await assertTagNameAvailable(data.name, id)
  }

  const tag = await prisma.tag.update({
    where: { id: BigInt(id) },
    data: {
      ...data,
      updatedBy: operatorId,
    },
    ...tagArgs,
  })
  return serializeTag(tag)
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id: BigInt(id) } })
  return { success: true as const }
}
