import { authedProcedure, publicProcedure, router } from '../../rpc/trpc'
import { userOutputSchema } from '../user/dto'
import { loginByPassword } from './auth.service'
import { loginInputSchema, loginOutputSchema } from './dto'

export const authRouter = router({
  login: publicProcedure
    .meta({
      openapi: {
        summary: 'User login',
        tags: ['auth'],
      },
    })
    .input(loginInputSchema)
    .output(loginOutputSchema)
    .mutation(({ input }) => loginByPassword(input.account, input.password)),

  me: authedProcedure
    .meta({
      openapi: {
        summary: 'Current user profile',
        tags: ['auth'],
      },
    })
    .output(userOutputSchema)
    .query(({ ctx }) => ctx.user),
})
