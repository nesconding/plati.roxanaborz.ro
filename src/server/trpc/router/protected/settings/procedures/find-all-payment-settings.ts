import { TRPCError } from '@trpc/server'
import { protectedProcedure } from '~/server/trpc/config'
import { PaymentsSettingsTableValidators } from '~/shared/validation/tables'

export const findAllPaymentSettingsProcedure = protectedProcedure
  .output(PaymentsSettingsTableValidators.select.array())
  .query(({ ctx }) => {
    try {
      return ctx.db.query.payments_settings.findMany({
        orderBy: (payments_settings, { asc }) => asc(payments_settings.label),
        where: (payments_settings, { isNull }) =>
          isNull(payments_settings.deletedAt)
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all payment settings'
      })
    }
  })
