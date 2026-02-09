import { z } from 'zod'

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const tagListInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(10),
    keyword: z.string().trim().min(1).optional(),
  })
  .optional()

export const tagListOutputSchema = z.object({
  items: z.array(tagSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
})

const tagIdSchema = z.string().regex(/^\d+$/, { message: 'id must be a numeric string' })

export const tagByIdInputSchema = z.object({ id: tagIdSchema })

export const createTagInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(255).nullable().optional(),
})

export const updateTagInputSchema = z.object({
  id: tagIdSchema,
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(255).nullable().optional(),
})

export const deleteTagOutputSchema = z.object({ success: z.literal(true) })

export type TagListInput = z.infer<typeof tagListInputSchema>
export type CreateTagInput = z.infer<typeof createTagInputSchema>
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>
