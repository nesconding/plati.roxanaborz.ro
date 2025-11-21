import { createTRPCRouter } from '~/server/trpc/config'
import { findAllProductOrdersProcedure } from '~/server/trpc/router/protected/product-orders/procedures/find-all-orders'
import { updateProductOrderStatusProcedure } from '~/server/trpc/router/protected/product-orders/procedures/update-status'

export const productOrdersRouter = createTRPCRouter({
  findAll: findAllProductOrdersProcedure,
  updateStatus: updateProductOrderStatusProcedure
})
