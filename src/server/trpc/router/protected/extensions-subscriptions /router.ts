import { createTRPCRouter } from '~/server/trpc/config'
import { findAllExtensionsSubscriptionsProcedure } from '~/server/trpc/router/protected/extensions-subscriptions /procedures/find-all-subscriptions'

export const extensionsSubscriptionsRouter = createTRPCRouter({
  findAll: findAllExtensionsSubscriptionsProcedure
})
