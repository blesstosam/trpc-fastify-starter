import { z } from 'zod'

export const randomNumberOutputSchema = z.object({
  randomNumber: z.number(),
})
