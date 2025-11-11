import { createTRPCRouter } from '~/server/trpc/config'
import { createOneContractProcedure } from '~/server/trpc/router/protected/contracts/procedures/create-one-contract'
import { findAllContractsProcedure } from '~/server/trpc/router/protected/contracts/procedures/find-all-contracts'
import { findOneContractByIdProcedure } from '~/server/trpc/router/protected/contracts/procedures/find-one-contract-by-id'

export const contractsRouter = createTRPCRouter({
  createOne: createOneContractProcedure,
  findAll: findAllContractsProcedure,
  findOneById: findOneContractByIdProcedure
})
