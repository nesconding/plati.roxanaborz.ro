import { TRPCError } from '@trpc/server'
import { protectedProcedure } from '~/server/trpc/config'
import { NumericString } from '~/shared/validation/utils'

const output = NumericString()

export const getEURToRONRateProcedure = protectedProcedure
  .output(output)
  .query(async ({ ctx }) => {
    try {
      const constant = await ctx.db.query.constants.findFirst()
      const eurToRonRate = constant?.eurToRonRate

      if (!eurToRonRate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'EUR to RON rate not found'
        })
      }

      return eurToRonRate
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get EUR to RON rate'
      })
    }
  })
