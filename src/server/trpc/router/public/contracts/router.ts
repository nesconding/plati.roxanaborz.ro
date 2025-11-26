import { createTRPCRouter } from '~/server/trpc/config'
import { generateFilledContractProcedure } from '~/server/trpc/router/public/contracts/procedures/generate-filled-contract'

export const contractsRouter = createTRPCRouter({
  generateFilledContract: generateFilledContractProcedure
})
