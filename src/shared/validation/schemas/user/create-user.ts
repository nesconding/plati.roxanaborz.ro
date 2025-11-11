import z from 'zod'
import { UserEmailSchema } from '~/shared/validation/schemas/user/fields/email'
import { UserNameSchema } from '~/shared/validation/schemas/user/fields/name'
import { UserPhoneSchema } from '~/shared/validation/schemas/user/fields/phone'

export const CreateUserSchema = z
  .object({
    email: UserEmailSchema,
    phoneNumber: UserPhoneSchema.optional()
  })
  .extend(UserNameSchema.shape)
export type CreateUserSchema = z.infer<typeof CreateUserSchema>
