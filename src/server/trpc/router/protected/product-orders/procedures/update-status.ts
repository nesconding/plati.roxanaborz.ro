import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { BankTransferProductService } from '~/server/services/bank-transfer-product'
import { protectedProcedure } from '~/server/trpc/config'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { ProductOrdersTableValidators } from '~/shared/validation/tables'

export const updateProductOrderStatusProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      status: z.union([
        z.literal(OrderStatusType.Cancelled),
        z.literal(OrderStatusType.Completed),
        z.literal(OrderStatusType.PendingBankTransferPayment),
        z.literal(OrderStatusType.ProcessingBankTransferPayment)
      ])
    })
  )
  .output(ProductOrdersTableValidators.select)
  .mutation(async ({ ctx, input }) => {
    const { id, status } = input

    // If completing, first fetch order with payment link to check if bank transfer
    if (status === OrderStatusType.Completed) {
      const orderWithPaymentLink = await ctx.db.query.product_orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, id),
        with: {
          productPaymentLink: true
        }
      })

      // Update order status
      const [productOrder] = await ctx.db
        .update(product_orders)
        .set({ status })
        .where(eq(product_orders.id, id))
        .returning()

      // If bank transfer, create membership and subscription
      if (
        orderWithPaymentLink?.productPaymentLink?.paymentMethodType ===
        PaymentMethodType.BankTransfer
      ) {
        const bankTransferService = new BankTransferProductService(ctx.db)
        await bankTransferService.completeBankTransferOrder(id)
      }

      return productOrder
    }

    // For non-completion status updates, just update the status
    const [productOrder] = await ctx.db
      .update(product_orders)
      .set({ status })
      .where(eq(product_orders.id, id))
      .returning()

    return productOrder
  })
