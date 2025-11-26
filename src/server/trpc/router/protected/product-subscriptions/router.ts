import { createTRPCRouter } from '~/server/trpc/config'
import { cancelProductSubscriptionProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/cancel-subscription'
import { findAllProductSubscriptionsProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/find-all-subscriptions'
import { forceRetryProductPaymentProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/force-retry-payment'
import { rescheduleProductPaymentProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/reschedule-payment'
import { retryFailedProductPaymentProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/retry-failed-payment'
import { setProductSubscriptionOnHoldProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/set-on-hold'
import { updateProductPaymentScheduleProcedure } from '~/server/trpc/router/protected/product-subscriptions/procedures/update-payment-schedule'

export const productSubscriptionsRouter = createTRPCRouter({
  cancel: cancelProductSubscriptionProcedure,
  findAll: findAllProductSubscriptionsProcedure,
  forceRetryPayment: forceRetryProductPaymentProcedure,
  reschedulePayment: rescheduleProductPaymentProcedure,
  retryPayment: retryFailedProductPaymentProcedure,
  setOnHold: setProductSubscriptionOnHoldProcedure,
  updatePaymentSchedule: updateProductPaymentScheduleProcedure
})
