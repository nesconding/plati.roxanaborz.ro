import { createTRPCRouter } from '~/server/trpc/config'
import { createOneProductPaymentLinkProcedure } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link'
import { findAllProductPaymentLinksProcedure } from '~/server/trpc/router/protected/product-payment-links/procedures/find-all-product-payment-links'

export const productPaymentLinksRouter = createTRPCRouter({
  createOne: createOneProductPaymentLinkProcedure,
  findAll: findAllProductPaymentLinksProcedure
})
