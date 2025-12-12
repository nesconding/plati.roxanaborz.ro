import { createTRPCRouter } from '~/server/trpc/config'
import { getBankDetailsProcedure } from '~/server/trpc/router/public/settings/procedures/get-bank-details'

export const settingsRouter = createTRPCRouter({
  getBankDetails: getBankDetailsProcedure
})
