import crypto from 'crypto'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure } from '~/server/trpc/config'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

const inputSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  token: z.string().min(1, 'Token is required'),
  type: z.nativeEnum(PaymentProductType)
})

const outputSchema = z.object({
  customerEmail: z.string(),
  customerName: z.string().nullable(),
  id: z.string(),
  productName: z.string()
})

export const validateUpdateTokenProcedure = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ input, ctx }) => {
    const { subscriptionId, token, type } = input

    // Hash the input token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const now = new Date().toISOString()

    if (type === PaymentProductType.Product) {
      const subscription = await ctx.db.query.product_subscriptions.findFirst({
        where: (product_subscriptions, { and, eq, gt }) =>
          and(
            eq(product_subscriptions.id, subscriptionId),
            eq(product_subscriptions.updatePaymentToken, hashedToken),
            gt(product_subscriptions.updatePaymentTokenExpiresAt, now)
          )
      })

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired update link'
        })
      }

      return {
        customerEmail: subscription.customerEmail,
        customerName: subscription.customerName,
        id: subscription.id,
        productName: subscription.productName
      }
    } else {
      const subscription = await ctx.db.query.extension_subscriptions.findFirst({
        where: (extension_subscriptions, { and, eq, gt }) =>
          and(
            eq(extension_subscriptions.id, subscriptionId),
            eq(extension_subscriptions.updatePaymentToken, hashedToken),
            gt(extension_subscriptions.updatePaymentTokenExpiresAt, now)
          )
      })

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired update link'
        })
      }

      return {
        customerEmail: subscription.customerEmail,
        customerName: subscription.customerName,
        id: subscription.id,
        productName: subscription.productName
      }
    }
  })
