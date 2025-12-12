import { createTRPCRouter } from '~/server/trpc/config'
import { confirmBankTransferProcedure } from './procedures/confirm-bank-transfer'
import { findPendingOrdersProcedure } from './procedures/find-pending-orders'
import { getOrderDetailsProcedure } from './procedures/get-order-details'

export const bankTransfersRouter = createTRPCRouter({
  confirmBankTransfer: confirmBankTransferProcedure,
  findPendingOrders: findPendingOrdersProcedure,
  getOrderDetails: getOrderDetailsProcedure
})
