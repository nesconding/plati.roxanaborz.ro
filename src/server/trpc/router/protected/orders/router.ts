import { createTRPCRouter } from '~/server/trpc/config'
import { findAllOrdersProcedure } from '~/server/trpc/router/protected/orders/procedures/find-all-orders'

export const ordersRouter = createTRPCRouter({
  findAll: findAllOrdersProcedure
})
