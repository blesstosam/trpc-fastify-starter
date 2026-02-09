import z from 'zod'
import { authRouter } from '../modules/auth'
import { subRouter } from '../modules/sub'
import { tagsRouter } from '../modules/tag'
import { usersRouter } from '../modules/user'
import { publicProcedure, router } from './trpc'

const routes = {
  auth: authRouter,
  sub: subRouter,
  tags: tagsRouter,
  users: usersRouter,
  health: publicProcedure
    .meta({
      openapi: {
        summary: 'Health check',
        tags: ['system'],
      },
    })
    .output(z.object({ message: z.literal('ok') }))
    .query(() => ({ message: 'ok' })),
}

function applyOpenApiDefaults(record: Record<string, unknown>, parentPath: string[] = []) {
  for (const [key, node] of Object.entries(record)) {
    const currentPath = [...parentPath, key]
    const current = node as {
      _def?: { record?: Record<string, unknown>, type?: string, procedure?: boolean, meta?: { openapi?: Record<string, unknown> } }
      meta?: { openapi?: Record<string, unknown> }
    }

    if (current._def?.record) {
      applyOpenApiDefaults(current._def.record, currentPath)
      continue
    }

    const openapiMeta = current._def?.meta?.openapi ?? current.meta?.openapi
    if (!current._def?.procedure || !openapiMeta) {
      continue
    }

    if (!openapiMeta.method) {
      openapiMeta.method = current._def.type === 'query' ? 'GET' : 'POST'
    }
    if (!openapiMeta.path) {
      openapiMeta.path = `/${currentPath.join('.')}`
    }
  }
}

applyOpenApiDefaults(routes)

export const appRouter = router(routes)

export type AppRouter = typeof appRouter
