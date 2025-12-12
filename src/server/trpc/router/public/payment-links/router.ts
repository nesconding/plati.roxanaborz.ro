import { createTRPCRouter } from '~/server/trpc/config'
import { findOnePaymentLinkByIdProcedure } from '~/server/trpc/router/public/payment-links/procedures/find-one-payment-link-by-id'
import { initiateBankTransferPaymentProcedure } from '~/server/trpc/router/public/payment-links/procedures/initiate-bank-transfer-payment'
import { initiateTbiPaymentProcedure } from '~/server/trpc/router/public/payment-links/procedures/initiate-tbi-payment'

export const paymentLinksRouter = createTRPCRouter({
  findOneById: findOnePaymentLinkByIdProcedure,
  initiateBankTransferPayment: initiateBankTransferPaymentProcedure,
  initiateTbiPayment: initiateTbiPaymentProcedure
})
