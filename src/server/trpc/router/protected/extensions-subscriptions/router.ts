import { createTRPCRouter } from '~/server/trpc/config'
import { cancelExtensionSubscriptionProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/cancel-subscription'
import { findAllExtensionsSubscriptionsProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/find-all-subscriptions'
import { forceRetryExtensionPaymentProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/force-retry-payment'
import { generateExtensionUpdatePaymentTokenProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/generate-update-payment-token'
import { rescheduleExtensionPaymentProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/reschedule-payment'
import { retryFailedExtensionPaymentProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/retry-failed-payment'
import { setExtensionSubscriptionOnHoldProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/set-on-hold'
import { updateExtensionPaymentScheduleProcedure } from '~/server/trpc/router/protected/extensions-subscriptions/procedures/update-payment-schedule'

export const extensionsSubscriptionsRouter = createTRPCRouter({
  cancel: cancelExtensionSubscriptionProcedure,
  findAll: findAllExtensionsSubscriptionsProcedure,
  forceRetryPayment: forceRetryExtensionPaymentProcedure,
  generateUpdatePaymentToken: generateExtensionUpdatePaymentTokenProcedure,
  reschedulePayment: rescheduleExtensionPaymentProcedure,
  retryPayment: retryFailedExtensionPaymentProcedure,
  setOnHold: setExtensionSubscriptionOnHoldProcedure,
  updatePaymentSchedule: updateExtensionPaymentScheduleProcedure
})
