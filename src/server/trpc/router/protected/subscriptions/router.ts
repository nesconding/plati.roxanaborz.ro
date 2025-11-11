import { createTRPCRouter } from '~/server/trpc/config'
import { findAllSubscriptionsProcedure } from '~/server/trpc/router/protected/subscriptions/procedures/find-all-subscriptions'

export const subscriptionsRouter = createTRPCRouter({
  findAll: findAllSubscriptionsProcedure
})
