import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { SubscriptionMembershipSyncService } from '~/server/services/subscription-membership-sync'
import { protectedProcedure } from '~/server/trpc/config'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required'),
  newDate: z.string().datetime('Must be a valid ISO 8601 date')
})

export const rescheduleExtensionPaymentProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, newDate } = input

    // Verify subscription exists
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

    // Validate new date is in the future
    const newPaymentDate = new Date(newDate)
    if (newPaymentDate <= new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment date must be in the future'
      })
    }

    const subscriptionMembershipSyncService =
      new SubscriptionMembershipSyncService(ctx.db)
    // Reschedule payment
    await subscriptionMembershipSyncService.reschedulePayment(
      id,
      'extension',
      newDate
    )

    return {
      message: 'Payment rescheduled successfully',
      success: true
    }
  })
