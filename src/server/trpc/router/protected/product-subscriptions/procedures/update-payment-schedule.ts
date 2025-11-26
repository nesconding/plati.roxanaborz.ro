import { z } from 'zod'
import { SubscriptionMembershipSyncService } from '~/server/services/subscription-membership-sync'
import { protectedProcedure } from '~/server/trpc/config'

const inputSchema = z.object({
  subscriptions: z.array(
    z.object({
      id: z.string(),
      newPaymentDate: z.string().datetime()
    })
  )
})

export const updateProductPaymentScheduleProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { subscriptions } = input

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // Verify subscription exists
          const subscription =
            await ctx.db.query.product_subscriptions.findFirst({
              where: (product_subscriptions, { eq }) =>
                eq(product_subscriptions.id, sub.id)
            })

          if (!subscription) {
            return {
              error: 'Subscription not found',
              id: sub.id,
              success: false
            }
          }

          const subscriptionMembershipSyncService =
            new SubscriptionMembershipSyncService(ctx.db)

          // Reschedule payment
          await subscriptionMembershipSyncService.reschedulePayment(
            sub.id,
            'product',
            sub.newPaymentDate
          )

          return { id: sub.id, success: true }
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            id: sub.id,
            success: false
          }
        }
      })
    )

    const successCount = results.filter((r) => r.success).length
    const errors = results.filter((r) => !r.success)

    return {
      errors,
      message: `Successfully rescheduled ${successCount} out of ${subscriptions.length} subscriptions`,
      successCount
    }
  })
