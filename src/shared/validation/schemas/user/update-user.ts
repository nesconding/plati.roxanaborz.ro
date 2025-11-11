import z from 'zod'
import { CreateUserSchema } from './create-user'

export const UpdateUserSchema = CreateUserSchema.extend({ userId: z.string() })
export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>
