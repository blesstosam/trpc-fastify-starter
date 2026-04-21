import z from 'zod'

export const fileSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  size: z.string(),
  type: z.string(),
  url: z.string(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  owner: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const fileListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().min(1).optional(),
}).optional()

export const fileListOutputSchema = z.object({
  items: z.array(fileSchema),
  total: z.number().int(),
})

const fileKeySchema = z.string().trim().min(1, 'key 不能为空')

export const createFileInputSchema = z.object({
  name: z.string().trim().min(1, '文件名不能为空').max(255, '文件名长度不能超过 255'),
  type: z.string().trim().min(1, '文件类型不能为空').max(191, '文件类型长度不能超过 191'),
  contentBase64: z.string().trim().min(1, '文件内容不能为空'),
  key: fileKeySchema.max(255, 'key 长度不能超过 255').optional(),
})

export const addFileInputSchema = z.object({
  key: fileKeySchema.max(255, 'key 长度不能超过 255'),
  name: z.string().trim().min(1, '文件名不能为空').max(255, '文件名长度不能超过 255'),
})

export const fileSignedUrlInputSchema = z.object({
  key: fileKeySchema,
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
