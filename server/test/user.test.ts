import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../src/generated/prisma/client'
import type { AppRouter } from '../src/rpc/router'
import { randomUUID } from 'node:crypto'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { hashPassword } from '../src/lib/auth'
import { nextSnowflakeId } from '../src/lib/snowflake'

let app: FastifyInstance
let prisma: PrismaClient
let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>
const createdUserIds: string[] = []
let createdAuthUserId: bigint | null = null

describe('user module tRPC integration', () => {
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
    const account = `vitest-user-auth-${suffix}`
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

    const loginResult = await noAuthClient.auth.login.mutate({
      account,
      password,
    })

    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
          transformer: superjson,
          headers() {
            return {
              authorization: `Bearer ${loginResult.token}`,
            }
          },
        }),
      ],
    })
  })

  afterEach(async () => {
    await cleanupCreatedUsers()
  })

  afterAll(async () => {
    await cleanupCreatedUsers()
    if (createdAuthUserId) {
      await prisma.user.delete({
        where: {
          id: createdAuthUserId,
        },
      })
    }
    await app.close()
    await prisma.$disconnect()
  })

  it('creates a user through trpc/client and persists it to database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const payload = {
      username: `vitest-user-${suffix}`,
      fullName: `测试用户-${suffix}`,
      avatar: 'https://example.com/avatar.png',
      password: `secret-${suffix}`,
      state: 1,
    }

    const createdUser = await trpcClient.users.create.mutate(payload)
    createdUserIds.push(createdUser.id)

    expect(createdUser.username).toBe(payload.username)
    expect(createdUser.fullName).toBe(payload.fullName)
    expect(createdUser.avatar).toBe(payload.avatar)
    expect(createdUser.state).toBe(payload.state)
    expect(createdUser.id).toBeTypeOf('string')

    const persisted = await prisma.user.findUnique({
      where: {
        id: BigInt(createdUser.id),
      },
    })

    expect(persisted).not.toBeNull()
    expect(persisted?.username).toBe(payload.username)
    expect(persisted?.fullName).toBe(payload.fullName)
    expect(persisted?.avatar).toBe(payload.avatar)
    expect(persisted?.state).toBe(payload.state)
  })

  it('lists users with paginated metadata', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdUser = await createUserForTest(suffix)

    const result = await trpcClient.users.list.query({
      keyword: suffix,
    })

    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.items.some(item => item.id === createdUser.id)).toBe(true)
  })

  it('gets a user by id through trpc/client', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdUser = await createUserForTest(suffix)

    const result = await trpcClient.users.getById.query({ id: createdUser.id })

    expect(result.id).toBe(createdUser.id)
    expect(result.username).toBe(createdUser.username)
    expect(result.fullName).toBe(createdUser.fullName)
    expect(result.avatar).toBe(createdUser.avatar)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('updates a user through trpc/client and persists changes to database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdUser = await createUserForTest(suffix)
    const updatePayload = {
      id: createdUser.id,
      username: `updated-user-${suffix}`,
      fullName: `已更新用户-${suffix}`,
      avatar: 'https://example.com/updated-avatar.png',
      password: `updated-secret-${suffix}`,
      state: 0,
    }

    const updatedUser = await trpcClient.users.update.mutate(updatePayload)

    expect(updatedUser.id).toBe(createdUser.id)
    expect(updatedUser.username).toBe(updatePayload.username)
    expect(updatedUser.fullName).toBe(updatePayload.fullName)
    expect(updatedUser.avatar).toBe(updatePayload.avatar)
    expect(updatedUser.state).toBe(updatePayload.state)

    const persisted = await prisma.user.findUnique({
      where: {
        id: BigInt(createdUser.id),
      },
    })

    expect(persisted).not.toBeNull()
    expect(persisted?.username).toBe(updatePayload.username)
    expect(persisted?.fullName).toBe(updatePayload.fullName)
    expect(persisted?.avatar).toBe(updatePayload.avatar)
    expect(persisted?.state).toBe(updatePayload.state)
  })

  it('removes a user through trpc/client and deletes it from database', async () => {
    const suffix = randomUUID().slice(0, 8)
    const createdUser = await createUserForTest(suffix)

    const result = await trpcClient.users.remove.mutate({ id: createdUser.id })
    expect(result).toEqual({ success: true })

    const persisted = await prisma.user.findUnique({
      where: {
        id: BigInt(createdUser.id),
      },
    })

    expect(persisted).toBeNull()
  })
})

async function createUserForTest(suffix: string) {
  const createdUser = await trpcClient.users.create.mutate({
    username: `vitest-user-${suffix}`,
    fullName: `测试用户-${suffix}`,
    avatar: 'https://example.com/avatar.png',
    password: `secret-${suffix}`,
    state: 1,
  })
  createdUserIds.push(createdUser.id)
  return createdUser
}

async function cleanupCreatedUsers() {
  if (createdUserIds.length === 0) {
    return
  }

  const ids = createdUserIds.splice(0, createdUserIds.length)
  await prisma.user.deleteMany({
    where: {
      id: {
        in: ids.map(id => BigInt(id)),
      },
    },
  })
}
