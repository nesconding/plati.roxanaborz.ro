import { createTRPCRouter } from '~/server/trpc/config'
import { generateFilledContractProcedure } from '~/server/trpc/router/public/contracts/procedures/generate-filled-contract'
import { updateOrderBillingDataProcedure } from '~/server/trpc/router/public/contracts/procedures/update-order-billing-data'

export const contractsRouter = createTRPCRouter({
  generateFilledContract: generateFilledContractProcedure,
  updateOrderBillingData: updateOrderBillingDataProcedure
})
