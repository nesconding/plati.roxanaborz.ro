import { TRPCError } from '@trpc/server'

import { protectedProcedure } from '~/server/trpc/config'
import { ContractsTableValidators } from '~/shared/validation/tables'

export const findAllContractsProcedure = protectedProcedure
  .output(ContractsTableValidators.select.array())
  .query(({ ctx }) => {
    try {
      return ctx.db.query.contracts.findMany({
        orderBy: (contracts, { asc }) => asc(contracts.createdAt),
        where: (contracts, { isNull }) => isNull(contracts.deletedAt)
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all contracts'
      })
    }
  })
