import { createTRPCRouter } from '~/server/trpc/config'
import { findAllPaymentSettingsProcedure } from '~/server/trpc/router/protected/settings/procedures/find-all-payment-settings'
import { getEURToRONRateProcedure } from '~/server/trpc/router/protected/settings/procedures/get-eur-to-ron-rate'
import { findAllFirstPaymentDateAfterDepositOptionsProcedure } from './procedures/find-all-first-payment-date-after-deposit-options'

export const settingsRouter = createTRPCRouter({
  findAllFirstPaymentDateAfterDepositOptions:
    findAllFirstPaymentDateAfterDepositOptionsProcedure,
  findAllPaymentSettings: findAllPaymentSettingsProcedure,
  getEURToRONRate: getEURToRONRateProcedure
})
