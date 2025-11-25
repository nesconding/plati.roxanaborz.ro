import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const retryFailedExtensionPaymentProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

    // Verify subscription exists
    const subscription = await ctx.db.query.extension_subscriptions.findFirst({
      where: (extension_subscriptions, { eq }) =>
        eq(extension_subscriptions.id, id),
      with: {
        membership: true,
        parentOrder: true
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

    // Manual retry not yet implemented
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message:
        'Manual payment retry not yet implemented. Please contact support or update your payment method.'
    })
  })
