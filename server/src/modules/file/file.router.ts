import z from 'zod'
import { authedProcedure, router } from '../../rpc/trpc'
import {
  addFileInputSchema,
  createFileInputSchema,
  fileListInputSchema,
  fileListOutputSchema,
  fileSchema,
  fileSignedUrlInputSchema,
  fileSignedUrlOutputSchema,
  storageTokenSchema,
} from './dto'
import { addFile, createFile, getSignedUrl, getStorageToken, listFiles, listStorageBuckets } from './file.service'

const bucketInfoSchema = z.object({ name: z.string() })

export const fileRouter = router({
  list: authedProcedure
    .meta({
      openapi: {
        summary: 'List files',
        tags: ['file'],
      },
    })
    .input(fileListInputSchema)
    .output(fileListOutputSchema)
    .query(({ input }) => listFiles(input)),

  create: authedProcedure
    .meta({
      openapi: {
        summary: 'Upload file',
        tags: ['file'],
      },
    })
    .input(createFileInputSchema)
    .output(fileSchema)
    .mutation(({ ctx, input }) => createFile(input, ctx.user.id)),

  add: authedProcedure
    .meta({
      openapi: {
        summary: 'Add file by key',
        tags: ['file'],
      },
    })
    .input(addFileInputSchema)
    .output(fileSchema)
    .mutation(({ ctx, input }) => addFile(input, ctx.user.id)),

  sts: authedProcedure
    .meta({
      openapi: {
        summary: 'Get upload token',
        tags: ['file'],
      },
    })
    .output(storageTokenSchema.nullable())
    .query(() => getStorageToken()),

  buckets: authedProcedure
    .meta({
      openapi: {
        summary: 'List storage buckets',
        tags: ['file'],
      },
    })
    .output(bucketInfoSchema.array())
    .query(() => listStorageBuckets()),

  getSignedUrl: authedProcedure
    .meta({
      openapi: {
        summary: 'Get signed download URL',
        tags: ['file'],
      },
    })
    .input(fileSignedUrlInputSchema)
    .output(fileSignedUrlOutputSchema)
    .query(({ input }) => getSignedUrl(input)),
})
