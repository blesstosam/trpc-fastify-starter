import type { AddFileInput, CreateFileInput, FileListInput, FileSignedUrlInput } from './dto'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { prisma } from '../../lib/prisma'
import { nextSnowflakeId } from '../../lib/snowflake'
import { getStorageProvider } from './storage'

const fileSelect = {
  id: true,
  key: true,
  name: true,
  size: true,
  type: true,
  url: true,
  createdBy: true,
  updatedBy: true,
  owner: true,
  createdAt: true,
  updatedAt: true,
} as const

interface FileRow {
  id: bigint
  key: string
  name: string
  size: bigint
  type: string
  url: string
  createdBy: bigint | null
  updatedBy: bigint | null
  owner: bigint | null
  createdAt: Date
  updatedAt: Date
}

function serializeFile(file: FileRow) {
  return {
    ...file,
    id: file.id.toString(),
    size: file.size.toString(),
    createdBy: file.createdBy?.toString() ?? null,
    updatedBy: file.updatedBy?.toString() ?? null,
    owner: file.owner?.toString() ?? null,
  }
}

function buildFetchUrl(key: string) {
  return `/file/fetch/${encodeURIComponent(key)}`
}

function sanitizeFileName(filename: string) {
  // eslint-disable-next-line e18e/prefer-static-regex
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
      updatedAt: new Date(),
    },
    select: fileSelect,
  })

  return serializeFile(file)
}

export async function listFiles(input: FileListInput) {
  const page = input?.page ?? 1
  const pageSize = input?.pageSize ?? 20
  const keyword = input?.keyword?.trim()
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
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: fileSelect,
    }),
    prisma.file.count({ where }),
  ])

  return {
    items: items.map(serializeFile),
    total,
  }
}

export async function createFile(input: CreateFileInput, operatorId: string) {
  const storage = getStorageProvider()
  await storage.ensureBucket()

  const key = input.key?.trim() || `${randomUUID()}_${sanitizeFileName(input.name)}`
  const body = decodeBase64(input.contentBase64)

  await storage.putObject(key, body)

  return createFileRecord({
    key,
    name: input.name.trim(),
    type: input.type.trim(),
    size: BigInt(body.byteLength),
    operatorId,
  })
}

export async function addFile(input: AddFileInput, operatorId: string) {
  const key = input.key.trim()
  const storage = getStorageProvider()
  const metadata = await storage.getObjectMeta(key).catch(() => null)

  if (!metadata) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Could not find file ${key}.` })
  }

  return createFileRecord({
    key,
    name: input.name.trim(),
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
    throw new TRPCError({ code: 'NOT_FOUND', message: `Could not find file ${input.key}.` })
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
    throw new TRPCError({ code: 'NOT_FOUND', message: `Could not find file ${key}.` })
  }

  const storage = getStorageProvider()
  const stream = await storage.getFileStream(file.key)

  return {
    stream,
    name: file.name,
    type: file.type,
  }
}
