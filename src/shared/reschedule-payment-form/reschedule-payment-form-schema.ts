import { z } from 'zod'

export const ReschedulePaymentFormSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required'),
  newPaymentDate: z.date(),
  subscriptionType: z.enum(['product', 'extension'])
})

export type ReschedulePaymentFormValues = z.infer<
  typeof ReschedulePaymentFormSchema
>

export const ReschedulePaymentFormDefaultValues: Partial<ReschedulePaymentFormValues> =
  {
    id: '',
    subscriptionType: 'product'
  }
