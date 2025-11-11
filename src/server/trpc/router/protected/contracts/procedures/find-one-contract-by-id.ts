import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure } from '~/server/trpc/config'
import { ContractsTableValidators } from '~/shared/validation/tables'

export const findOneContractByIdProcedure = protectedProcedure
  .input(
    z.object({
      contractId: z.string()
    })
  )
  .output(ContractsTableValidators.select.nullable())
  .query(async ({ ctx, input }) => {
    try {
      const contract = await ctx.db.query.contracts.findFirst({
        where: (contracts, { eq, isNull, and }) =>
          and(eq(contracts.id, input.contractId), isNull(contracts.deletedAt))
      })
      return contract ?? null
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find one contract by id'
      })
    }
  })
