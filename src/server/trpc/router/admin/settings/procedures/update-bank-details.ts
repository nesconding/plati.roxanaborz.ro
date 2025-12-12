import { TRPCError } from '@trpc/server'
import { bank_details } from '~/server/database/schema'

import { adminProcedure } from '~/server/trpc/config'
import { BankDetailsTableValidators } from '~/shared/validation/tables'

export const updateBankDetailsProcedure = adminProcedure
  .input(
    BankDetailsTableValidators.update.omit({
      createdAt: true,
      id: true,
      updatedAt: true
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db.update(bank_details).set(input)
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update bank details'
      })
    }
  })
