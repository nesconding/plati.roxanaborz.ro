import { createTRPCRouter } from '~/server/trpc/config'
import { findAllProductOrdersProcedure } from '~/server/trpc/router/protected/product-orders/procedures/find-all-orders'
import { getPaymentLinkByOrderProcedure } from '~/server/trpc/router/protected/product-orders/procedures/get-payment-link-by-order'
import { updateProductOrderStatusProcedure } from '~/server/trpc/router/protected/product-orders/procedures/update-status'

export const productOrdersRouter = createTRPCRouter({
  findAll: findAllProductOrdersProcedure,
  getPaymentLinkByOrder: getPaymentLinkByOrderProcedure,
  updateStatus: updateProductOrderStatusProcedure
})
