import { z } from 'zod'

export const SetOnHoldFormSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required'),
  subscriptionType: z.enum(['product', 'extension'])
})

export type SetOnHoldFormValues = z.infer<typeof SetOnHoldFormSchema>

export const SetOnHoldFormDefaultValues: SetOnHoldFormValues = {
  id: '',
  subscriptionType: 'product'
}
