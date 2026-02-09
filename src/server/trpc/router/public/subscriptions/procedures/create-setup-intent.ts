import crypto from 'crypto'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure } from '~/server/trpc/config'
import { StripeService } from '~/server/services/stripe'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

const inputSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  token: z.string().min(1, 'Token is required'),
  type: z.nativeEnum(PaymentProductType)
})

const outputSchema = z.object({
  clientSecret: z.string()
})

export const createSetupIntentProcedure = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ input, ctx }) => {
    const { subscriptionId, token, type } = input

    // Hash the input token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const now = new Date().toISOString()

    let parentOrderStripePaymentIntentId: string

    if (type === PaymentProductType.Product) {
      const subscription = await ctx.db.query.product_subscriptions.findFirst({
        where: (product_subscriptions, { and, eq, gt }) =>
          and(
            eq(product_subscriptions.id, subscriptionId),
            eq(product_subscriptions.updatePaymentToken, hashedToken),
            gt(product_subscriptions.updatePaymentTokenExpiresAt, now)
          ),
        with: {
          parentOrder: {
            columns: {
              stripePaymentIntentId: true
            }
          }
        }
      })

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired update link'
        })
      }

      parentOrderStripePaymentIntentId =
        subscription.parentOrder.stripePaymentIntentId
    } else {
      const subscription = await ctx.db.query.extension_subscriptions.findFirst(
        {
          where: (extension_subscriptions, { and, eq, gt }) =>
            and(
              eq(extension_subscriptions.id, subscriptionId),
              eq(extension_subscriptions.updatePaymentToken, hashedToken),
              gt(extension_subscriptions.updatePaymentTokenExpiresAt, now)
            ),
          with: {
            parentOrder: {
              columns: {
                stripePaymentIntentId: true
              }
            }
          }
        }
      )

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired update link'
        })
      }

      parentOrderStripePaymentIntentId =
        subscription.parentOrder.stripePaymentIntentId
    }

    // Get customer ID from the original payment intent
    const originalPaymentIntent = await StripeService.findPaymentIntentById(
      parentOrderStripePaymentIntentId
    )

    const customerId =
      typeof originalPaymentIntent.customer === 'string'
        ? originalPaymentIntent.customer
        : originalPaymentIntent.customer?.id

    if (!customerId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No customer associated with this subscription'
      })
    }

    // Create SetupIntent for updating payment method
    const { clientSecret } = await StripeService.createSetupIntent({
      customerId,
      metadata: {
        subscriptionId,
        type
      }
    })

    return { clientSecret }
  })
