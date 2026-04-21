import scalarApi from '@scalar/fastify-api-reference'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify, { FastifyInstance } from 'fastify'
import { generateOpenApiDocument } from 'trpc-to-openapi'
import { getJwtSecret } from './lib/auth'
import { registerFileFetchRoute } from './modules/file'
import { createContext } from './rpc/context'
import { appRouter } from './rpc/router'

// 1GB
const MaxSize = 1024 * 1024 * 1024

export function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: MaxSize,
  })

  app.register(import('@fastify/cors'), {
    origin: true,
  })

  app.register(import('@fastify/jwt'), {
    secret: getJwtSecret(),
  })

  app.register(fastifyTRPCPlugin, {
    prefix: '/rpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  })

  registerFileFetchRoute(app)
  initDoc(app)

  return app
}

async function initDoc(app: FastifyInstance) {
  const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'tRPC OpenAPI',
    description: 'API docs for this tRPC project.',
    version: '1.0.0',
    baseUrl: 'http://localhost:2022/rpc',
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token auth.',
      },
    },
  })

  app.register(scalarApi, {
    routePrefix: '/doc',
    configuration: {
      content: openApiDocument,
    },
  })
}
