import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { OrderStatusType } from '~/shared/enums/order-status-type'

const PendingOrderSchema = z.object({
  customerEmail: z.string(),
  customerName: z.string().nullable(),
  id: z.string(),
  orderType: z.enum(['product', 'extension']),
  productName: z.string(),
  status: z.string(),
  type: z.string()
})

export type PendingOrder = z.infer<typeof PendingOrderSchema>

export const findPendingOrdersProcedure = protectedProcedure
  .output(z.array(PendingOrderSchema))
  .query(async ({ ctx }) => {
    // Fetch pending product orders
    const productOrders = await ctx.db.query.product_orders.findMany({
      orderBy: (product_orders, { desc }) => desc(product_orders.createdAt),
      where: (product_orders, { eq, isNull, and, or }) =>
        and(
          or(
            eq(
              product_orders.status,
              OrderStatusType.PendingBankTransferPayment
            ),
            eq(
              product_orders.status,
              OrderStatusType.ProcessingBankTransferPayment
            )
          ),
          isNull(product_orders.deletedAt)
        )
    })

    // Fetch pending extension orders
    const extensionOrders = await ctx.db.query.extension_orders.findMany({
      orderBy: (extension_orders, { desc }) => desc(extension_orders.createdAt),
      where: (extension_orders, { eq, isNull, and, or }) =>
        and(
          or(
            eq(
              extension_orders.status,
              OrderStatusType.PendingBankTransferPayment
            ),
            eq(
              extension_orders.status,
              OrderStatusType.ProcessingBankTransferPayment
            )
          ),
          isNull(extension_orders.deletedAt)
        )
    })

    // Combine and format orders
    const pendingOrders: PendingOrder[] = [
      ...productOrders.map((order) => ({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        id: order.id,
        orderType: 'product' as const,
        productName: order.productName,
        status: order.status,
        type: order.type
      })),
      ...extensionOrders.map((order) => ({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        id: order.id,
        orderType: 'extension' as const,
        productName: order.productName,
        status: order.status,
        type: order.type
      }))
    ]

    return pendingOrders
  })
