import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'

const OrderDetailsSchema = z.object({
  customerEmail: z.string(),
  customerName: z.string().nullable(),
  id: z.string(),
  membership: z
    .object({
      endDate: z.string(),
      id: z.string(),
      startDate: z.string(),
      status: z.string()
    })
    .nullable(),
  orderType: z.enum(['product', 'extension']),
  paymentLink: z.object({
    currency: z.enum(['EUR', 'RON']),
    depositAmountInCents: z.number().nullable(),
    extensionId: z.string().nullable(),
    extensionInstallmentsCount: z.number().nullable(),
    firstPaymentDateAfterDeposit: z.string().nullable(),
    id: z.string(),
    priceAmountInCents: z.number(),
    productId: z.string().nullable(),
    productInstallmentsCount: z.number().nullable(),
    type: z.enum(PaymentLinkType)
  }),
  productName: z.string(),
  status: z.string(),
  subscription: z
    .object({
      id: z.string(),
      nextPaymentDate: z.string().nullable(),
      remainingPayments: z.number(),
      status: z.string()
    })
    .nullable(),
  type: z.string()
})

export type OrderDetails = z.infer<typeof OrderDetailsSchema>

// Helper to parse numeric string to number
const parseNumeric = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return isNaN(parsed) ? null : parsed
}

export const getOrderDetailsProcedure = protectedProcedure
  .input(
    z.object({
      orderId: z.string(),
      orderType: z.enum(['product', 'extension'])
    })
  )
  .output(OrderDetailsSchema.nullable())
  .query(async ({ ctx, input }) => {
    const { orderId, orderType } = input

    if (orderType === 'product') {
      const order = await ctx.db.query.product_orders.findFirst({
        where: (product_orders, { eq }) => eq(product_orders.id, orderId),
        with: {
          productPaymentLink: {
            with: {
              product: true
            }
          }
        }
      })

      if (!order || !order.productPaymentLink) {
        return null
      }

      // Find related membership and subscription
      const membership = await ctx.db.query.memberships.findFirst({
        where: (memberships, { eq }) => eq(memberships.parentOrderId, orderId)
      })

      const subscription = await ctx.db.query.product_subscriptions.findFirst({
        where: (product_subscriptions, { eq }) =>
          eq(product_subscriptions.parentOrderId, orderId)
      })

      return {
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        id: order.id,
        membership: membership
          ? {
              endDate: membership.endDate,
              id: membership.id,
              startDate: membership.startDate,
              status: membership.status
            }
          : null,
        orderType: 'product' as const,
        paymentLink: {
          currency: order.productPaymentLink.currency,
          depositAmountInCents: parseNumeric(
            order.productPaymentLink.depositAmountInCents
          ),
          extensionId: null,
          extensionInstallmentsCount: null,
          firstPaymentDateAfterDeposit:
            order.productPaymentLink.firstPaymentDateAfterDeposit,
          id: order.productPaymentLink.id,
          priceAmountInCents:
            parseNumeric(order.productPaymentLink.totalAmountToPayInCents) ?? 0,
          productId: order.productPaymentLink.productId,
          productInstallmentsCount:
            order.productPaymentLink.productInstallmentsCount,
          type: order.productPaymentLink.type
        },
        productName: order.productName,
        status: order.status,
        subscription: subscription
          ? {
              id: subscription.id,
              nextPaymentDate: subscription.nextPaymentDate,
              remainingPayments: subscription.remainingPayments,
              status: subscription.status
            }
          : null,
        type: order.type
      }
    }

    // Extension order
    const order = await ctx.db.query.extension_orders.findFirst({
      where: (extension_orders, { eq }) => eq(extension_orders.id, orderId),
      with: {
        extensionPaymentLink: {
          with: {
            extension: true
          }
        },
        membership: true
      }
    })

    if (!order || !order.extensionPaymentLink) {
      return null
    }

    // Find related subscription
    const subscription = await ctx.db.query.extension_subscriptions.findFirst({
      where: (extension_subscriptions, { eq }) =>
        eq(extension_subscriptions.parentOrderId, orderId)
    })

    return {
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      id: order.id,
      membership: order.membership
        ? {
            endDate: order.membership.endDate,
            id: order.membership.id,
            startDate: order.membership.startDate,
            status: order.membership.status
          }
        : null,
      orderType: 'extension' as const,
      paymentLink: {
        currency: order.extensionPaymentLink.currency,
        depositAmountInCents: parseNumeric(
          order.extensionPaymentLink.depositAmountInCents
        ),
        extensionId: order.extensionPaymentLink.extensionId,
        extensionInstallmentsCount:
          order.extensionPaymentLink.extensionInstallmentsCount,
        firstPaymentDateAfterDeposit:
          order.extensionPaymentLink.firstPaymentDateAfterDeposit,
        id: order.extensionPaymentLink.id,
        priceAmountInCents:
          parseNumeric(order.extensionPaymentLink.totalAmountToPayInCents) ?? 0,
        productId: null,
        productInstallmentsCount: null,
        type: order.extensionPaymentLink.type
      },
      productName: order.productName,
      status: order.status,
      subscription: subscription
        ? {
            id: subscription.id,
            nextPaymentDate: subscription.nextPaymentDate,
            remainingPayments: subscription.remainingPayments,
            status: subscription.status
          }
        : null,
      type: order.type
    }
  })
