import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/database/schema'
import { protectedProcedure } from '~/server/trpc/config'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const setExtensionSubscriptionOnHoldProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

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

    // Set subscription to OnHold and void pending retries - does not update membership
    await ctx.db
      .update(schema.extension_subscriptions)
      .set({
        lastPaymentAttemptDate: null,
        lastPaymentFailureReason: null,
        paymentFailureCount: 0,
        status: SubscriptionStatusType.OnHold
      })
      .where(eq(schema.extension_subscriptions.id, id))

    return {
      message: 'Subscription set to OnHold',
      success: true
    }
  })
