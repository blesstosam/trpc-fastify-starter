import { publicProcedure, router } from '../../rpc/trpc'
import {
  createUserInputSchema,
  deleteUserOutputSchema,
  updateUserInputSchema,
  userByIdInputSchema,
  userListInputSchema,
  userListOutputSchema,
  userOutputSchema,
} from './dto'
import { createUser, deleteUser, getUserById, listUsers, updateUser } from './user.service'

export const usersRouter = router({
  list: publicProcedure
    .meta({
      openapi: {
        summary: 'List users',
        tags: ['user'],
      },
    })
    .input(userListInputSchema)
    .output(userListOutputSchema)
    .query(({ input }) => listUsers(input)),

  getById: publicProcedure
    .meta({
      openapi: {
        summary: 'Get user by id',
        tags: ['user'],
      },
    })
    .input(userByIdInputSchema)
    .output(userOutputSchema)
    .query(({ input }) => getUserById(input.id)),

  create: publicProcedure
    .meta({
      openapi: {
        summary: 'Create user',
        tags: ['user'],
      },
    })
    .input(createUserInputSchema)
    .output(userOutputSchema)
    .mutation(({ input }) => createUser(input)),

  update: publicProcedure
    .meta({
      openapi: {
        summary: 'Update user',
        tags: ['user'],
      },
    })
    .input(updateUserInputSchema)
    .output(userOutputSchema)
    .mutation(({ input }) => updateUser(input)),

  remove: publicProcedure
    .meta({
      openapi: {
        summary: 'Delete user',
        tags: ['user'],
      },
    })
    .input(userByIdInputSchema)
    .output(deleteUserOutputSchema)
    .mutation(({ input }) => deleteUser(input.id)),
})
