import { z } from 'zod'

export const CancelSubscriptionFormSchema = z.object({
  cancelType: z.enum(['graceful', 'immediate']),
  id: z.string().min(1, 'Subscription ID is required'),
  subscriptionType: z.enum(['product', 'extension'])
})

export type CancelSubscriptionFormValues = z.infer<
  typeof CancelSubscriptionFormSchema
>

export const CancelSubscriptionFormDefaultValues: CancelSubscriptionFormValues =
  {
    cancelType: 'graceful',
    id: '',
    subscriptionType: 'product'
  }
