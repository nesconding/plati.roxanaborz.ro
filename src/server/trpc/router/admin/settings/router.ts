import { createTRPCRouter } from '~/server/trpc/config'
import { createOneContractProcedure } from '~/server/trpc/router/admin/settings/procedures/create-one-contract'
import { deleteOneContractProcedure } from '~/server/trpc/router/admin/settings/procedures/delete-one-contract'
import { updateEURToRONRateProcedure } from '~/server/trpc/router/admin/settings/procedures/update-eur-to-ron-rate'
import { updateManyFirstPaymentDateAfterDepositOptionProcedure } from '~/server/trpc/router/admin/settings/procedures/update-many-first-payment-date-after-deposit-option'
import { updateManyPaymentSettingsProcedure } from '~/server/trpc/router/admin/settings/procedures/update-many-payment-settings'
import { updateOneContractProcedure } from '~/server/trpc/router/admin/settings/procedures/update-one-contract'

export const settingsRouter = createTRPCRouter({
  createOneContract: createOneContractProcedure,
  deleteOneContract: deleteOneContractProcedure,
  updateEURToRONRate: updateEURToRONRateProcedure,
  updateManyFirstPaymentDateAfterDepositOption:
    updateManyFirstPaymentDateAfterDepositOptionProcedure,
  updateManyPaymentSettings: updateManyPaymentSettingsProcedure,
  updateOneContract: updateOneContractProcedure
})
