import { createTRPCRouter } from '~/server/trpc/config'
import { findAllContractsProcedure } from '~/server/trpc/router/protected/contracts/procedures/find-all-contracts'
import { findOneContractByIdProcedure } from '~/server/trpc/router/protected/contracts/procedures/find-one-contract-by-id'

export const contractsRouter = createTRPCRouter({
  findAll: findAllContractsProcedure,
  findOneById: findOneContractByIdProcedure
})
