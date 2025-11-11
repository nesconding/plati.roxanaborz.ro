import z from 'zod'

export const UserNameSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3)
})
