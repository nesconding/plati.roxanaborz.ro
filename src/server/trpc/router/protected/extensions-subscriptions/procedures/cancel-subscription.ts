import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/database/schema'
import { protectedProcedure } from '~/server/trpc/config'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  cancelType: z.enum(['graceful', 'immediate']),
  id: z.string().min(1, 'Subscription ID is required')
})

export const cancelExtensionSubscriptionProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, cancelType } = input

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

    if (cancelType === 'graceful') {
      // Validate subscription state
      if (subscription.status === SubscriptionStatusType.Cancelled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Subscription is already cancelled'
        })
      }

      if (subscription.scheduledCancellationDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Subscription already has a scheduled cancellation'
        })
      }

      if (!subscription.nextPaymentDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot schedule cancellation: subscription has no next payment date'
        })
      }

      // Set scheduled cancellation date to next payment date
      await ctx.db
        .update(schema.extension_subscriptions)
        .set({
          lastPaymentAttemptDate: null,
          lastPaymentFailureReason: null,
          paymentFailureCount: 0,
          scheduledCancellationDate: subscription.nextPaymentDate
        })
        .where(eq(schema.extension_subscriptions.id, id))
    } else {
      // Immediate cancellation - cancel subscription and membership
      await ctx.db
        .update(schema.extension_subscriptions)
        .set({
          lastPaymentAttemptDate: null,
          lastPaymentFailureReason: null,
          paymentFailureCount: 0,
          status: SubscriptionStatusType.Cancelled
        })
        .where(eq(schema.extension_subscriptions.id, id))

      // Cancel membership if linked
      if (subscription.membershipId) {
        await ctx.db
          .update(schema.memberships)
          .set({ status: MembershipStatusType.Cancelled })
          .where(eq(schema.memberships.id, subscription.membershipId))
      }
    }

    return {
      message:
        cancelType === 'graceful'
          ? 'Subscription will be cancelled at the end of the current billing period'
          : 'Subscription cancelled immediately',
      success: true
    }
  })
