import { z } from 'zod'

export const userOutputSchema = z.object({
  id: z.string(),
  userId: z.number().int(),
  username: z.string(),
  fullName: z.string().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  superAdmin: z.number().int(),
})

export const userListInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(10),
    keyword: z.string().trim().min(1).optional(),
  })
  .optional()

export const userListOutputSchema = z.object({
  items: z.array(userOutputSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
})

const userIdSchema = z.string().regex(/^\d+$/, { message: 'id must be a numeric string' })

export const userByIdInputSchema = z.object({ id: userIdSchema })

export const createUserInputSchema = z.object({
  userId: z.number().int().positive(),
  username: z.string().trim().min(1),
  fullName: z.string().trim().min(1).nullable().optional(),
  avatar: z.string().trim().url().nullable().optional(),
  password: z.string().min(6),
  superAdmin: z.boolean().optional(),
})

export const updateUserInputSchema = z.object({
  id: userIdSchema,
  username: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(1).nullable().optional(),
  avatar: z.string().trim().url().nullable().optional(),
  password: z.string().min(6).optional(),
  superAdmin: z.boolean().optional(),
})

export const deleteUserOutputSchema = z.object({ success: z.literal(true) })

export type UserListInput = z.infer<typeof userListInputSchema>
export type CreateUserInput = z.infer<typeof createUserInputSchema>
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>
