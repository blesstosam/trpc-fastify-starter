import type { FileDefaultArgs, FileGetPayload } from '../../generated/prisma/models/File'
import type { AddFileInput, CreateFileInput, FileListInput, FileSignedUrlInput } from './dto'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'
import { serializeUser } from '../user/dto'
import { getStorageProvider } from './storage'

const fileArgs = {
  include: {
    createdByUser: true,
    updatedByUser: true,
    ownerUser: true,
  },
} satisfies FileDefaultArgs

type FilePayload = FileGetPayload<typeof fileArgs>

function serializeFile(file: FilePayload) {
  return {
    id: file.id.toString(),
    key: file.key,
    name: file.name,
    size: file.size.toString(),
    type: file.type,
    url: file.url,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    createdBy: serializeUser(file.createdByUser),
    updatedBy: serializeUser(file.updatedByUser),
    owner: serializeUser(file.ownerUser),
  }
}

function buildFetchUrl(key: string) {
  return `/file/fetch/${encodeURIComponent(key)}`
}

function sanitizeFileName(filename: string) {
  return filename.replace(/[^\w.-]/g, '_')
}

function decodeBase64(contentBase64: string) {
  const parts = contentBase64.split(',')
  const normalized = parts.length > 1 ? parts.at(-1) : contentBase64
  const buffer = Buffer.from(normalized!, 'base64')

  if (buffer.byteLength === 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '文件内容不能为空' })
  }

  return buffer
}

async function createFileRecord(input: {
  key: string
  name: string
  type: string
  size: bigint
  operatorId: string
}) {
  const operator = BigInt(input.operatorId)
  const file = await prisma.file.create({
    data: {
      id: nextSnowflakeId(),
      key: input.key,
      name: input.name,
      type: input.type,
      size: input.size,
      url: buildFetchUrl(input.key),
      createdBy: operator,
      updatedBy: operator,
      owner: operator,
    },
    ...fileArgs,
  })

  return serializeFile(file)
}

export async function listFiles(input: FileListInput) {
  const page = input.page
  const pageSize = input.pageSize
  const keyword = input?.keyword
  const where = keyword
    ? {
        OR: [
          { key: { contains: keyword } },
          { name: { contains: keyword } },
        ],
      }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: pageSize,
      ...fileArgs,
    }),
    prisma.file.count({ where }),
  ])

  return {
    items: items.map(serializeFile),
    total,
    page,
    pageSize,
  }
}

export async function createFile(input: CreateFileInput, operatorId: string) {
  const storage = getStorageProvider()
  await storage.ensureBucket()

  const key = input.key || `${randomUUID()}_${sanitizeFileName(input.name)}`
  const body = decodeBase64(input.contentBase64)

  await storage.putObject(key, body)

  return createFileRecord({
    key,
    name: input.name,
    type: input.type,
    size: BigInt(body.byteLength),
    operatorId,
  })
}

export async function addFile(input: AddFileInput, operatorId: string) {
  const key = input.key
  const storage = getStorageProvider()
  const metadata = await storage.getObjectMeta(key).catch(() => null)

  if (!metadata) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `文件 ${key} 不存在` })
  }

  return createFileRecord({
    key,
    name: input.name,
    type: metadata.type,
    size: metadata.size,
    operatorId,
  })
}

export async function getSignedUrl(input: FileSignedUrlInput) {
  const file = await prisma.file.findUnique({
    where: { key: input.key },
    select: { key: true },
  })

  if (!file) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `文件 ${input.key} 不存在` })
  }

  const storage = getStorageProvider()
  const url = await storage.getSignedUrl(file.key, input.expires)
  return { url }
}

export async function getStorageToken() {
  const storage = getStorageProvider()
  return storage.getStsToken()
}

export async function listStorageBuckets() {
  const storage = getStorageProvider()
  return storage.listBuckets()
}

export async function getFileStreamByKey(key: string) {
  const file = await prisma.file.findUnique({
    where: { key },
    select: { key: true, name: true, type: true },
  })

  if (!file) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `文件 ${key} 不存在` })
  }

  const storage = getStorageProvider()
  const stream = await storage.getFileStream(file.key)

  return {
    stream,
    name: file.name,
    type: file.type,
  }
}
