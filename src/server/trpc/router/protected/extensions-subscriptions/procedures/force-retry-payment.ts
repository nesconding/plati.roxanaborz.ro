import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const forceRetryExtensionPaymentProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

    // Verify subscription exists and is on hold
    const subscription = await ctx.db.query.extension_subscriptions.findFirst({
      where: (extension_subscriptions, { eq }) =>
        eq(extension_subscriptions.id, id)
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
  })
