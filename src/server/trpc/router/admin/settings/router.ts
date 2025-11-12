import { createTRPCRouter } from '~/server/trpc/config'
import { updateEURToRONRateProcedure } from '~/server/trpc/router/admin/settings/procedures/update-eur-to-ron-rate'
import { updateManyFirstPaymentDateAfterDepositOptionProcedure } from '~/server/trpc/router/admin/settings/procedures/update-many-first-payment-date-after-deposit-option'
import { updateManyPaymentSettingsProcedure } from '~/server/trpc/router/admin/settings/procedures/update-many-payment-settings'

export const settingsRouter = createTRPCRouter({
  updateEURToRONRate: updateEURToRONRateProcedure,
  updateManyFirstPaymentDateAfterDepositOption:
    updateManyFirstPaymentDateAfterDepositOptionProcedure,
  updateManyPaymentSettings: updateManyPaymentSettingsProcedure
})
