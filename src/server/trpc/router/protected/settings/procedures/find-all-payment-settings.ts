import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure } from '~/server/trpc/config'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

const output = z.array(
  z.object({
    currency: z.enum(PaymentCurrencyType),
    extraTaxRate: z.number(),
    id: z.string(),
    label: z.string(),
    tvaRate: z.string()
  })
)

export const findAllPaymentSettingsProcedure = protectedProcedure
  .output(output)
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
