import type { User } from '../../generated/prisma/client'
import { z } from 'zod'
import { createListQueryInputSchema, createPaginatedListOutputSchema, idSchema } from '../../lib/schemas'

export const userOutputSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string().nullable(),
  avatar: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  state: z.number().int(),
})

export const userListInputSchema = createListQueryInputSchema({
  defaultPageSize: 10,
})

export const userListOutputSchema = createPaginatedListOutputSchema(userOutputSchema)

export const userByIdInputSchema = z.object({ id: idSchema })

export const createUserInputSchema = z.object({
  username: z.string().trim().min(1),
  fullName: z.string().trim().min(1).nullable().optional(),
  avatar: z.string().trim().url().nullable().optional(),
  password: z.string().min(6),
  state: z.number().int().min(0).max(1).optional(),
})

export const updateUserInputSchema = createUserInputSchema
  .omit({ password: true })
  .partial()
  .extend({
    id: idSchema,
    password: z.string().min(6).optional(),
  })

export const deleteUserOutputSchema = z.object({ success: z.literal(true) })

export type UserListInput = z.infer<typeof userListInputSchema>
export type CreateUserInput = z.infer<typeof createUserInputSchema>
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>

export function serializeUser(user: User) {
  return {
    id: user.id.toString(),
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    state: user.state,
  }
}

export function serializeUserWithNull(user: User | null) {
  if (!user) {
    return null
  }
  return serializeUser(user)
}
