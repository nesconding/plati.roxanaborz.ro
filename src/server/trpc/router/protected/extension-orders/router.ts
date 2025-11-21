import { createTRPCRouter } from '~/server/trpc/config'
import { findAllExtensionOrdersProcedure } from '~/server/trpc/router/protected/extension-orders/procedures/find-all-orders'
import { updateExtensionOrderStatusProcedure } from '~/server/trpc/router/protected/extension-orders/procedures/update-status'

export const extensionOrdersRouter = createTRPCRouter({
  findAll: findAllExtensionOrdersProcedure,
  updateStatus: updateExtensionOrderStatusProcedure
})
