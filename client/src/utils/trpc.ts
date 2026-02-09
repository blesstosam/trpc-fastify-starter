import type { AppRouter } from '../../../server/src/rpc/router'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { getAuthToken } from './auth'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:2022/rpc',
      transformer: superjson,
      headers() {
        const token = getAuthToken()
        if (!token) {
          return {}
        }
        return {
          Authorization: `Bearer ${token}`,
        }
      },
    }),
  ],
})
