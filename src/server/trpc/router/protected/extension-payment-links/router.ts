import { createTRPCRouter } from '~/server/trpc/config'
import { createOneExtensionPaymentLinkProcedure } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link'
import { findAllExtensionPaymentLinksProcedure } from '~/server/trpc/router/protected/extension-payment-links/procedures/find-all-extension-payment-links'

export const extensionPaymentLinksRouter = createTRPCRouter({
  createOne: createOneExtensionPaymentLinkProcedure,
  findAll: findAllExtensionPaymentLinksProcedure
})
