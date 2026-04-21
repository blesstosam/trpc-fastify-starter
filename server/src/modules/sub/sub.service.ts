import { observable } from '@trpc/server/observable'

export function randomNumberSubscription(signal?: AbortSignal) {
  return observable<{ randomNumber: number }>((emit) => {
    const timer = setInterval(() => {
      emit.next({ randomNumber: Math.random() })
    }, 1000)

    const onAbort = () => {
      clearInterval(timer)
    }
    signal?.addEventListener('abort', onAbort)

    return () => {
      signal?.removeEventListener('abort', onAbort)
      clearInterval(timer)
    }
  })
}
