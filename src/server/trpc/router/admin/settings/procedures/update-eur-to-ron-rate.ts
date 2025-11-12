import { TRPCError } from '@trpc/server'
import { constants } from '~/server/database/schema'

import { adminProcedure } from '~/server/trpc/config'
import { NumericString } from '~/shared/validation/utils'

export const updateEURToRONRateProcedure = adminProcedure
  .input(NumericString())
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db.update(constants).set({ eurToRonRate: input })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update EUR to RON rate'
      })
    }
  })
