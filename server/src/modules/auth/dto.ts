import { z } from 'zod'
import { userOutputSchema } from '../user/dto'

export const loginInputSchema = z.object({
  account: z.string().trim().min(1),
  password: z.string().min(6),
})

export const loginOutputSchema = z.object({
  token: z.string(),
  user: userOutputSchema,
})
