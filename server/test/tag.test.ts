import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../src/generated/prisma/client'
import type { AppRouter } from '../src/rpc/router'
import { randomUUID } from 'node:crypto'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

let app: FastifyInstance
let prisma: PrismaClient
let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>
const createdTagIds: string[] = []

describe('server app tRPC integration', () => {
  beforeAll(async () => {
    const [{ buildApp }, prismaModule] = await Promise.all([
      import('../src/app'),
      import('../src/lib/prisma'),
    ])

    prisma = prismaModule.prisma
    app = buildApp()
    await app.listen({
      host: '127.0.0.1',
      port: 0,
    })

    const address = app.server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve app server address')
    }

    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `http://127.0.0.1:${address.port}/rpc`,
          transformer: superjson,
        }),
      ],
    })
  })

  // 在每一次it描述的测试跑完都会执行
  afterEach(async () => {
    await cleanupCreatedTags()
  })

  afterAll(async () => {
    await cleanupCreatedTags()
    await app.close()
    await prisma.$disconnect()
  })

  it('creates a tag through trpc/client and persists it to database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const payload = {
      name: `vitest-tag-${suffix}`,
      description: `created-by-vitest-${suffix}`,
    }

    const createdTag = await trpcClient.tags.create.mutate(payload)
    createdTagIds.push(createdTag.id)

    expect(createdTag.name).toBe(payload.name)
    expect(createdTag.description).toBe(payload.description)
    expect(createdTag.id).toBeTypeOf('string')

    const persisted = await prisma.tag.findUnique({
      where: {
        id: BigInt(createdTag.id),
      },
    })

    expect(persisted).not.toBeNull()
    expect(persisted?.name).toBe(payload.name)
    expect(persisted?.description).toBe(payload.description)
  })

  it('lists tags and includes the created tag', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdTag = await createTagForTest(suffix)

    const result = await trpcClient.tags.list.query({
      page: 1,
      pageSize: 10,
      keyword: suffix,
    })

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.items.some(item => item.id === createdTag.id)).toBe(true)
  })

  it('gets a tag by id through trpc/client', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdTag = await createTagForTest(suffix)

    const result = await trpcClient.tags.getById.query({ id: createdTag.id })

    expect(result.id).toBe(createdTag.id)
    expect(result.name).toBe(createdTag.name)
    expect(result.description).toBe(createdTag.description)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('updates a tag through trpc/client and persists changes to database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdTag = await createTagForTest(suffix)
    const updatePayload = {
      id: createdTag.id,
      name: `updated-tag-${suffix}`,
      description: `updated-description-${suffix}`,
    }

    const updatedTag = await trpcClient.tags.update.mutate(updatePayload)

    expect(updatedTag.id).toBe(createdTag.id)
    expect(updatedTag.name).toBe(updatePayload.name)
    expect(updatedTag.description).toBe(updatePayload.description)

    const persisted = await prisma.tag.findUnique({
      where: {
        id: BigInt(createdTag.id),
      },
    })

    expect(persisted).not.toBeNull()
    expect(persisted?.name).toBe(updatePayload.name)
    expect(persisted?.description).toBe(updatePayload.description)
  })

  it('removes a tag through trpc/client and deletes it from database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdTag = await createTagForTest(suffix)

    const result = await trpcClient.tags.remove.mutate({ id: createdTag.id })
    expect(result).toEqual({ success: true })

    const persisted = await prisma.tag.findUnique({
      where: {
        id: BigInt(createdTag.id),
      },
    })

    expect(persisted).toBeNull()
  })
})

async function createTagForTest(suffix: string) {
  const payload = {
    name: `vitest-tag-${suffix}`,
    description: `created-by-vitest-${suffix}`,
  }

  const createdTag = await trpcClient.tags.create.mutate(payload)
  createdTagIds.push(createdTag.id)
  return createdTag
}

async function cleanupCreatedTags() {
  if (createdTagIds.length === 0) {
    return
  }

  const ids = createdTagIds.splice(0, createdTagIds.length)
  await prisma.tag.deleteMany({
    where: {
      id: {
        in: ids.map(id => BigInt(id)),
      },
    },
  })
}
