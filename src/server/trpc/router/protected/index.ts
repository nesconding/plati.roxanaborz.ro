import { createTRPCRouter } from '~/server/trpc/config'
import { authenticationRouter } from '~/server/trpc/router/protected/authentication/router'
import { contractsRouter } from '~/server/trpc/router/protected/contracts/router'
import { extensionPaymentLinksRouter } from '~/server/trpc/router/protected/extension-payment-links/router'
import { meetingsRouter } from '~/server/trpc/router/protected/meetings/router'
import { membershipsRouter } from '~/server/trpc/router/protected/memberships/router'
import { ordersRouter } from '~/server/trpc/router/protected/orders/router'
import { productPaymentLinksRouter } from '~/server/trpc/router/protected/product-payment-links/router'
import { productsRouter } from '~/server/trpc/router/protected/products/router'
import { settingsRouter } from '~/server/trpc/router/protected/settings/router'
import { subscriptionsRouter } from '~/server/trpc/router/protected/subscriptions/router'

export const protectedRouter = createTRPCRouter({
  authentication: authenticationRouter,
  contracts: contractsRouter,
  extensionPaymentLinks: extensionPaymentLinksRouter,
  meetings: meetingsRouter,
  memberships: membershipsRouter,
  orders: ordersRouter,
  productPaymentLinks: productPaymentLinksRouter,
  products: productsRouter,
  settings: settingsRouter,
  subscriptions: subscriptionsRouter
})
