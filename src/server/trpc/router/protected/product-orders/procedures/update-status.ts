import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { protectedProcedure } from '~/server/trpc/config'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { ProductOrdersTableValidators } from '~/shared/validation/tables'

export const updateProductOrderStatusProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      status: z.union([
        z.literal(OrderStatusType.Cancelled),
        z.literal(OrderStatusType.Completed),
        z.literal(OrderStatusType.ProcessingBankTransferPayment)
      ])
    })
  )
  .output(ProductOrdersTableValidators.select)
  .mutation(async ({ ctx, input }) => {
    const { id, status } = input

    const [productOrder] = await ctx.db
      .update(product_orders)
      .set({ status })
      .where(eq(product_orders.id, id))
      .returning()

    return productOrder
  })
