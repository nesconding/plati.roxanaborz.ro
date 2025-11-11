import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure } from '~/server/trpc/config'

const output = z.array(
  z.object({
    id: z.string(),
    value: z.number()
  })
)

export const findAllFirstPaymentDateAfterDepositOptionsProcedure =
  protectedProcedure.output(output).query(({ ctx }) => {
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
