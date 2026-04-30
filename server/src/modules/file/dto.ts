import z from 'zod'
import { createAuditFields, createListQueryInputSchema, createPaginatedListOutputSchema } from '../../lib/schemas'
import { userOutputSchema } from '../user/dto'

export const fileSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  size: z.string(),
  type: z.string(),
  url: z.string(),
  ...createAuditFields(userOutputSchema),
})

export const fileListInputSchema = createListQueryInputSchema()

export const fileListOutputSchema = createPaginatedListOutputSchema(fileSchema)

const fileKeySchema = z.string().trim().min(1, 'key 不能为空')
const persistedFileKeySchema = fileKeySchema.max(255, 'key 长度不能超过 255')
const fileNameSchema = z.string().trim().min(1, '文件名不能为空').max(255, '文件名长度不能超过 255')
const fileTypeSchema = z.string().trim().min(1, '文件类型不能为空').max(191, '文件类型长度不能超过 191')

export const createFileInputSchema = z.object({
  name: fileNameSchema,
  type: fileTypeSchema,
  contentBase64: z.string().trim().min(1, '文件内容不能为空'),
  key: persistedFileKeySchema.optional(),
})

export const addFileInputSchema = z.object({
  key: persistedFileKeySchema,
  name: fileNameSchema,
})

export const fileSignedUrlInputSchema = z.object({
  key: persistedFileKeySchema,
  expires: z.number().int().min(1).max(60 * 60 * 24 * 7).optional(),
})

export const fileSignedUrlOutputSchema = z.object({
  url: z.string(),
})

export const storageTokenSchema = z.object({
  accessKeyId: z.string(),
  accessKeySecret: z.string(),
  stsToken: z.string(),
  region: z.string(),
  bucket: z.string(),
})

export type FileListInput = z.infer<typeof fileListInputSchema>
export type CreateFileInput = z.infer<typeof createFileInputSchema>
export type AddFileInput = z.infer<typeof addFileInputSchema>
export type FileSignedUrlInput = z.infer<typeof fileSignedUrlInputSchema>
