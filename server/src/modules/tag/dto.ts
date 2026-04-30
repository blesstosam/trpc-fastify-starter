import { z } from 'zod'
import { createListQueryInputSchema, createPaginatedListOutputSchema, idSchema } from '../../lib/schemas'

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  owner: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const tagListInputSchema = createListQueryInputSchema()

export const tagListOutputSchema = createPaginatedListOutputSchema(tagSchema)

export const tagByIdInputSchema = z.object({ id: idSchema })

export const createTagInputSchema = z.object({
  name: z.string().trim().min(1, '标签名称不能为空').max(30, '标签名称不能超过 30 个字符'),
  description: z.string().trim().max(120, '描述不能超过 120 个字符').optional(),
})

export const updateTagInputSchema = createTagInputSchema.partial().extend({
  id: idSchema,
})

export const deleteTagOutputSchema = z.object({ success: z.literal(true) })

export type TagListInput = z.infer<typeof tagListInputSchema>
export type CreateTagInput = z.infer<typeof createTagInputSchema>
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>
