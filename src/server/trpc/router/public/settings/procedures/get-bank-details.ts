import { TRPCError } from '@trpc/server'
import { publicProcedure } from '~/server/trpc/config'
import { BankDetailsTableValidators } from '~/shared/validation/tables'

const output = BankDetailsTableValidators.select

export const getBankDetailsProcedure = publicProcedure
  .output(output)
  .query(async ({ ctx }) => {
    try {
      const bankDetails = await ctx.db.query.bank_details.findFirst()

      if (!bankDetails) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank details not found'
        })
      }

      return bankDetails
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get bank details'
      })
    }
  })
