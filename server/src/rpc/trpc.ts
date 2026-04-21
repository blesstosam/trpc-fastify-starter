import type { OpenApiMeta } from 'trpc-to-openapi'
import type { Context } from './context'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

type OpenApiMetaWithoutMethodAndPath = Omit<OpenApiMeta, 'openapi'> & {
  openapi?: Omit<NonNullable<OpenApiMeta['openapi']>, 'method' | 'path'>
}

const t = initTRPC.context<Context>().meta<OpenApiMetaWithoutMethodAndPath>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router

/**
 * 兼容openapi，构造input对象
 */
const openApiQueryInputCompat = t.middleware(async ({ ctx, input, type, next }) => {
  if (type === 'query' && input === undefined) {
    const query = ctx.req.query as Record<string, unknown> | undefined
    if (query && Object.keys(query).length > 0) {
      return next({ input: query })
    }
  }
  return next()
})

export const publicProcedure = t.procedure.use(openApiQueryInputCompat)

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const authedProcedure = publicProcedure.use(authMiddleware)
