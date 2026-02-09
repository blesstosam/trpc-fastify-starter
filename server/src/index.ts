import scalarApi from '@scalar/fastify-api-reference'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify, { FastifyInstance } from 'fastify'
import { generateOpenApiDocument } from 'trpc-to-openapi'
import { createContext } from './rpc/context'
import { appRouter } from './rpc/router'

async function main() {
  const app = Fastify({
    logger: true,
  })

  await app.register(import('@fastify/cors'), {
    origin: true,
  })

  await app.register(fastifyTRPCPlugin, {
    prefix: '/rpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  })

  await initDoc(app)

  await app.listen({
    host: '0.0.0.0',
    port: 2022,
  })
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

  await app.register(scalarApi, {
    routePrefix: '/doc',
    configuration: {
      content: openApiDocument,
    },
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
