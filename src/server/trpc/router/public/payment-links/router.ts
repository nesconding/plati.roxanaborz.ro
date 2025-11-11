import { createTRPCRouter } from '~/server/trpc/config'
import { findOnePaymentLinkByIdProcedure } from '~/server/trpc/router/public/payment-links/procedures/find-one-payment-link-by-id'

export const paymentLinksRouter = createTRPCRouter({
  findOneById: findOnePaymentLinkByIdProcedure
})
