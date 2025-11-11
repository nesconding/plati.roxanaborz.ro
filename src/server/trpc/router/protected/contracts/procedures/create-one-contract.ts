import { TRPCError } from '@trpc/server'

import { contracts } from '~/server/database/schema/business/models/contracts'

import { protectedProcedure } from '~/server/trpc/config'
import { ContractsTableValidators } from '~/shared/validation/tables'

export const createOneContractProcedure = protectedProcedure
  .input(
    ContractsTableValidators.insert.omit({
      createdAt: true,
      deletedAt: true,
      id: true,
      updatedAt: true
    })
  )
  .output(ContractsTableValidators.select)
  .query(async ({ ctx, input }) => {
    try {
      const contract = await ctx.db.insert(contracts).values(input).returning()
      return contract[0]
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find one contract by id'
      })
    }
  })
