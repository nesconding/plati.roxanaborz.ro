import { createTRPCRouter } from '~/server/trpc/config'
import { findAllProductSubscriptionsProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/find-all-subscriptions'

export const productSubscriptionsRouter = createTRPCRouter({
  findAll: findAllProductSubscriptionsProcedure
})
