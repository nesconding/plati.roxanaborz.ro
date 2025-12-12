import { createTRPCRouter } from '~/server/trpc/config'
import { createSetupIntentProcedure } from '~/server/trpc/router/public/subscriptions/procedures/create-setup-intent'
import { updatePaymentMethodProcedure } from '~/server/trpc/router/public/subscriptions/procedures/update-payment-method'
import { validateUpdateTokenProcedure } from '~/server/trpc/router/public/subscriptions/procedures/validate-update-token'

export const subscriptionsRouter = createTRPCRouter({
  createSetupIntent: createSetupIntentProcedure,
  updatePaymentMethod: updatePaymentMethodProcedure,
  validateUpdateToken: validateUpdateTokenProcedure
})
