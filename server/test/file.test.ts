import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../src/generated/prisma/client'
import type { AppRouter } from '../src/rpc/router'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword } from '../src/lib/auth'
import { nextSnowflakeId } from '../src/lib/snowflake'
import { getStorageProvider } from '../src/modules/file/storage'

let app: FastifyInstance
let prisma: PrismaClient
let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>
const createdFileIds: string[] = []
const createdObjectKeys: string[] = []
let createdAuthUserId: bigint | null = null

describe('file module tRPC integration', () => {
  beforeAll(async () => {
    process.env.FILE_SERVER = 'memory'

    const [{ buildApp }, prismaModule] = await Promise.all([
      import('../src/app'),
      import('../src/lib/prisma'),
    ])

    prisma = prismaModule.prisma
    app = buildApp()
    await app.listen({ host: '127.0.0.1', port: 0 })

    const address = app.server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve app server address')
    }

    const baseUrl = `http://127.0.0.1:${address.port}/rpc`
    const noAuthClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
          transformer: superjson,
        }),
      ],
    })

    const suffix = randomUUID().slice(0, 8)
    const account = `vitest-file-auth-${suffix}`
    const password = `secret-${suffix}`
    const user = await prisma.user.create({
      data: {
        id: nextSnowflakeId(),
        username: account,
        password: await hashPassword(password),
        updatedAt: new Date(),
      },
      select: { id: true },
    })
    createdAuthUserId = user.id

    const loginResult = await noAuthClient.auth.login.mutate({ account, password })

    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
          transformer: superjson,
          headers() {
            return { authorization: `Bearer ${loginResult.token}` }
          },
        }),
      ],
    })
  })

  afterEach(async () => {
    await cleanupFiles()
  })

  afterAll(async () => {
    await cleanupFiles()
    if (createdAuthUserId) {
      await prisma.user.delete({ where: { id: createdAuthUserId } })
    }
    await app.close()
    await prisma.$disconnect()
  })

  it('uploads file through tRPC and persists metadata', async () => {
    const suffix = randomUUID().slice(0, 8)
    const content = Buffer.from(`hello-${suffix}`)

    const created = await trpcClient.file.create.mutate({
      name: `demo-${suffix}.txt`,
      type: 'text/plain',
      contentBase64: content.toString('base64'),
    })

    createdFileIds.push(created.id)
    createdObjectKeys.push(created.key)

    expect(created.name).toContain(suffix)
    expect(created.type).toBe('text/plain')
    expect(created.size).toBe(String(content.byteLength))
    expect(created.url).toContain('/file/fetch/')
    expect(created.createdBy).toBe(createdAuthUserId?.toString() ?? null)
    expect(created.updatedBy).toBe(createdAuthUserId?.toString() ?? null)
    expect(created.owner).toBe(createdAuthUserId?.toString() ?? null)

    const persisted = await prisma.file.findUnique({ where: { id: BigInt(created.id) } })
    expect(persisted).not.toBeNull()
    expect(persisted?.key).toBe(created.key)
    expect(persisted?.createdBy?.toString()).toBe(createdAuthUserId?.toString())
    expect(persisted?.updatedBy?.toString()).toBe(createdAuthUserId?.toString())
    expect(persisted?.owner?.toString()).toBe(createdAuthUserId?.toString())
  })

  it('lists uploaded files', async () => {
    const suffix = randomUUID().slice(0, 8)
    const created = await createFileForTest(suffix)

    const result = await trpcClient.file.list.query({ keyword: suffix })

    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.items.some(item => item.id === created.id)).toBe(true)
  })

  it('returns signed url for uploaded file', async () => {
    const suffix = randomUUID().slice(0, 8)
    const created = await createFileForTest(suffix)

    const result = await trpcClient.file.getSignedUrl.query({ key: created.key })
    expect(result.url.length).toBeGreaterThan(0)
  })

  it('adds file record by existing object key', async () => {
    const suffix = randomUUID().slice(0, 8)
    const key = `manual-${suffix}.txt`
    const storage = getStorageProvider()
    await storage.putObject(key, Buffer.from(`manual-${suffix}`))
    createdObjectKeys.push(key)

    const added = await trpcClient.file.add.mutate({
      key,
      name: `manual-${suffix}.txt`,
    })

    createdFileIds.push(added.id)
    expect(added.key).toBe(key)
    expect(Number(added.size)).toBeGreaterThan(0)
    expect(added.createdBy).toBe(createdAuthUserId?.toString() ?? null)
  })
})

async function createFileForTest(suffix: string) {
  const content = Buffer.from(`content-${suffix}`)
  const created = await trpcClient.file.create.mutate({
    name: `file-${suffix}.txt`,
    type: 'text/plain',
    contentBase64: content.toString('base64'),
  })
  createdFileIds.push(created.id)
  createdObjectKeys.push(created.key)
  return created
}

async function cleanupFiles() {
  if (createdFileIds.length > 0) {
    const ids = createdFileIds.splice(0, createdFileIds.length)
    await prisma.file.deleteMany({
      where: {
        id: {
          in: ids.map(id => BigInt(id)),
        },
      },
    })
  }

  if (createdObjectKeys.length > 0) {
    const keys = createdObjectKeys.splice(0, createdObjectKeys.length)
    const storage = getStorageProvider()
    await Promise.all(keys.map(async key => storage.deleteObject(key).catch(() => undefined)))
  }
}
