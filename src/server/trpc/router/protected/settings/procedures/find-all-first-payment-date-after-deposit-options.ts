import { TRPCError } from '@trpc/server'
import { protectedProcedure } from '~/server/trpc/config'
import { FirstPaymentDateAfterDepositOptionsTableValidators } from '~/shared/validation/tables'

export const findAllFirstPaymentDateAfterDepositOptionsProcedure =
  protectedProcedure
    .output(FirstPaymentDateAfterDepositOptionsTableValidators.select.array())
    .query(({ ctx }) => {
      try {
        return ctx.db.query.first_payment_date_after_deposit_options.findMany({
          orderBy: (first_payment_date_after_deposit_options, { asc }) =>
            asc(first_payment_date_after_deposit_options.value),
          where: (first_payment_date_after_deposit_options, { isNull }) =>
            isNull(first_payment_date_after_deposit_options.deletedAt)
        })
      } catch (cause) {
        throw new TRPCError({
          cause,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find all first payment date after deposit options'
        })
      }
    })
