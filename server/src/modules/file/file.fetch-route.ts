import type { FastifyInstance } from 'fastify'
import { TRPCError } from '@trpc/server'
import { getFileStreamByKey } from './file.service'

interface FetchFileParams {
  '*': string
}

export function registerFileFetchRoute(app: FastifyInstance) {
  app.get<{ Params: FetchFileParams }>('/file/fetch/*', async (request, reply) => {
    const encodedKey = request.params['*']
    const key = decodeURIComponent(encodedKey)

    try {
      const { stream, type, name } = await getFileStreamByKey(key)

      const disposition = type.startsWith('application/')
        ? `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
        : 'inline'

      return reply
        .header('Content-Type', type)
        .header('Content-Disposition', disposition)
        .send(stream)
    }
    catch (error) {
      if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
        return reply.status(404).send({ message: error.message })
      }

      request.log.error({ error }, 'Failed to fetch file stream')
      return reply.status(500).send({ message: 'Failed to fetch file' })
    }
  })
}
