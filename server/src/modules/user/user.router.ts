import { authedProcedure, router } from '../../rpc/trpc'
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
  list: authedProcedure
    .meta({
      openapi: {
        summary: 'List users',
        tags: ['user'],
      },
    })
    .input(userListInputSchema)
    .output(userListOutputSchema)
    .query(({ input }) => listUsers(input)),

  getById: authedProcedure
    .meta({
      openapi: {
        summary: 'Get user by id',
        tags: ['user'],
      },
    })
    .input(userByIdInputSchema)
    .output(userOutputSchema)
    .query(({ input }) => getUserById(input.id)),

  create: authedProcedure
    .meta({
      openapi: {
        summary: 'Create user',
        tags: ['user'],
      },
    })
    .input(createUserInputSchema)
    .output(userOutputSchema)
    .mutation(({ input }) => createUser(input)),

  update: authedProcedure
    .meta({
      openapi: {
        summary: 'Update user',
        tags: ['user'],
      },
    })
    .input(updateUserInputSchema)
    .output(userOutputSchema)
    .mutation(({ input }) => updateUser(input)),

  remove: authedProcedure
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
