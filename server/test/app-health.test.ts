import type { FastifyInstance } from 'fastify'
import type { AppRouter } from '../src/rpc/router'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let app: FastifyInstance
let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>

describe('app health check', () => {
  beforeAll(async () => {
    const { buildApp } = await import('../src/app')

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

  afterAll(async () => {
    await app.close()
  })

  it('responds ok from health query after app starts', async () => {
    const result = await trpcClient.health.query()
    expect(result).toEqual({ message: 'ok' })
  })
})
