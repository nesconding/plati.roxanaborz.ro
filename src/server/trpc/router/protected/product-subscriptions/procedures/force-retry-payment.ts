import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const forceRetryProductPaymentProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

    // Verify subscription exists and is on hold
    const subscription = await ctx.db.query.product_subscriptions.findFirst({
      where: (product_subscriptions, { eq }) => eq(product_subscriptions.id, id)
    })

    if (!subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subscription not found'
      })
    }

    if (subscription.status !== SubscriptionStatusType.OnHold) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Can only retry payments for subscriptions on hold'
      })
    }

    // Manual retry not yet implemented
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message:
        'Manual payment retry not yet implemented. This would require integrating with Stripe to charge the saved payment method.'
    })

    // TODO: Implement manual retry logic
    // This would involve:
    // 1. Get the payment method from the original order's Stripe PaymentIntent
    // 2. Attempt to charge it using StripeService
    // 3. On success: Reset failure count, set status to Active, activate membership
    // 4. On failure: Update failure reason and last attempt date
  })
