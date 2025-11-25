import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { StripeProductHandlers } from '~/server/handlers/stripe-handlers/stripe-product-handlers'
import { protectedProcedure } from '~/server/trpc/config'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const retryFailedProductPaymentProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

    // Verify subscription exists
    const subscription = await ctx.db.query.product_subscriptions.findFirst({
      where: (product_subscriptions, { eq }) =>
        eq(product_subscriptions.id, id),
      with: {
        membership: true,
        parentOrder: {
          with: {
            productPaymentLink: true
          }
        }
      }
    })

    if (!subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subscription not found'
      })
    }

    // Verify subscription is on hold
    if (subscription.status !== SubscriptionStatusType.OnHold) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Can only retry failed payments for subscriptions on hold'
      })
    }

    // Verify there was a payment failure
    if (
      !subscription.paymentFailureCount ||
      subscription.paymentFailureCount === 0
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No failed payment to retry'
      })
    }

    // Attempt to charge the payment manually
    // This would need to be implemented in the StripeProductHandlers
    // For now, throw an error indicating this needs implementation
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message:
        'Manual payment retry not yet implemented. Please contact support or update your payment method.'
    })

    // TODO: Implement manual retry logic
    // This would involve:
    // 1. Get the payment method from the original order
    // 2. Attempt to charge it
    // 3. On success: reset failure count, update subscription status
    // 4. On failure: increment failure count
  })
