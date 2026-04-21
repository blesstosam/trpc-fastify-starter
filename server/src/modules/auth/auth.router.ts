import { jwtSignOptions } from '../../lib/auth'
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
    .mutation(async ({ ctx, input }) => {
      const user = await loginByPassword(input.account, input.password)
      const jwt = (ctx.req.server as typeof ctx.req.server & {
        jwt: {
          sign: (payload: object, options: object) => string
        }
      }).jwt

      const token = jwt.sign(
        {
          sub: user.id,
          username: user.username,
          state: user.state,
        },
        jwtSignOptions,
      )

      return { token, user }
    }),

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
