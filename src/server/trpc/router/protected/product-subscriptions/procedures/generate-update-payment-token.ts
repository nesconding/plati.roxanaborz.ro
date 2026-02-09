import crypto from 'crypto'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/database/schema'
import { protectedProcedure } from '~/server/trpc/config'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required')
})

export const generateProductUpdatePaymentTokenProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input

    const subscription = await ctx.db.query.product_subscriptions.findFirst({
      where: (product_subscriptions, { eq }) => eq(product_subscriptions.id, id)
    })

    if (!subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subscription not found'
      })
    }

    if (subscription.paymentMethod !== PaymentMethodType.Card) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Payment method update is only available for card subscriptions'
      })
    }

    if (
      subscription.status === SubscriptionStatusType.Cancelled ||
      subscription.status === SubscriptionStatusType.Completed
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Cannot update payment method for cancelled or completed subscriptions'
      })
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    // Set 24-hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await ctx.db
      .update(schema.product_subscriptions)
      .set({
        updatePaymentToken: hashedToken,
        updatePaymentTokenExpiresAt: expiresAt
      })
      .where(eq(schema.product_subscriptions.id, id))

    return {
      expiresAt,
      token: rawToken
    }
  })
