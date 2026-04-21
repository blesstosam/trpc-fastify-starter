import { publicProcedure, router } from '../../rpc/trpc'
import { randomNumberSubscription } from './sub.service'

export const subRouter = router({
  randomNumber: publicProcedure
    .subscription(({ signal }) => randomNumberSubscription(signal)),
})
