import { createTRPCRouter } from '~/server/trpc/config'
import { authenticationRouter } from '~/server/trpc/router/protected/authentication/router'
import { contractsRouter } from '~/server/trpc/router/protected/contracts/router'
import { extensionOrdersRouter } from '~/server/trpc/router/protected/extension-orders/router'
import { extensionPaymentLinksRouter } from '~/server/trpc/router/protected/extension-payment-links/router'
import { membershipsRouter } from '~/server/trpc/router/protected/memberships/router'
import { productOrdersRouter } from '~/server/trpc/router/protected/product-orders/router'
import { productPaymentLinksRouter } from '~/server/trpc/router/protected/product-payment-links/router'
import { productsRouter } from '~/server/trpc/router/protected/products/router'
import { scheduledEventsRouter } from '~/server/trpc/router/protected/scheduled-events/router'
import { settingsRouter } from '~/server/trpc/router/protected/settings/router'
import { subscriptionsRouter } from '~/server/trpc/router/protected/subscriptions/router'

export const protectedRouter = createTRPCRouter({
  authentication: authenticationRouter,
  contracts: contractsRouter,
  extensionOrders: extensionOrdersRouter,
  extensionPaymentLinks: extensionPaymentLinksRouter,
  memberships: membershipsRouter,
  productOrders: productOrdersRouter,
  productPaymentLinks: productPaymentLinksRouter,
  products: productsRouter,
  scheduledEvents: scheduledEventsRouter,
  settings: settingsRouter,
  subscriptions: subscriptionsRouter
})
