import { createTRPCRouter } from '~/server/trpc/config'
import { authenticationRouter } from '~/server/trpc/router/public/authentication/router'
import { paymentLinksRouter } from '~/server/trpc/router/public/payment-links/router'

export const publicRouter = createTRPCRouter({
  authentication: authenticationRouter,
  paymentLinks: paymentLinksRouter
})
