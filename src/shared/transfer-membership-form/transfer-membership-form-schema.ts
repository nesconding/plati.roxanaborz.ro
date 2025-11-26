import { z } from 'zod'

export const TransferMembershipFormSchema = z.object({
  id: z.string().min(1, 'Membership ID is required'),
  newCustomerEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
})

export type TransferMembershipFormValues = z.infer<
  typeof TransferMembershipFormSchema
>

export const TransferMembershipFormDefaultValues: TransferMembershipFormValues =
  {
    id: '',
    newCustomerEmail: ''
  }
