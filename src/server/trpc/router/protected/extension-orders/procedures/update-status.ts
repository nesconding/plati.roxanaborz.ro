import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { extension_orders } from '~/server/database/schema/business/models/extension-orders'
import { protectedProcedure } from '~/server/trpc/config'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { ExtensionOrdersTableValidators } from '~/shared/validation/tables'

export const updateExtensionOrderStatusProcedure = protectedProcedure
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
  .output(ExtensionOrdersTableValidators.select)
  .mutation(async ({ ctx, input }) => {
    const { id, status } = input

    const [productOrder] = await ctx.db
      .update(extension_orders)
      .set({ status })
      .where(eq(extension_orders.id, id))
      .returning()

    return productOrder
  })
