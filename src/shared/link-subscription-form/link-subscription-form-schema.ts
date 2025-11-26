import { z } from 'zod'

export const LinkSubscriptionFormSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  subscriptionType: z.enum(['product', 'extension'])
})

export type LinkSubscriptionFormValues = z.infer<
  typeof LinkSubscriptionFormSchema
>

export const LinkSubscriptionFormDefaultValues: LinkSubscriptionFormValues = {
  membershipId: '',
  subscriptionId: '',
  subscriptionType: 'product'
}
