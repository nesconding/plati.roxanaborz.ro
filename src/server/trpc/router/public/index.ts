import { createTRPCRouter } from '~/server/trpc/config'
import { authenticationRouter } from '~/server/trpc/router/public/authentication/router'
import { contractsRouter } from '~/server/trpc/router/public/contracts/router'
import { paymentLinksRouter } from '~/server/trpc/router/public/payment-links/router'
import { settingsRouter } from '~/server/trpc/router/public/settings/router'
import { subscriptionsRouter } from '~/server/trpc/router/public/subscriptions/router'

export const publicRouter = createTRPCRouter({
  authentication: authenticationRouter,
  contracts: contractsRouter,
  paymentLinks: paymentLinksRouter,
  settings: settingsRouter,
  subscriptions: subscriptionsRouter
})
