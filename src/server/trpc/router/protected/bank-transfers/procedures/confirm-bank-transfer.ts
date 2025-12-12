import { z } from 'zod'
import { BankTransferService } from '~/server/services/bank-transfer'
import { protectedProcedure } from '~/server/trpc/config'

export const confirmBankTransferProcedure = protectedProcedure
  .input(
    z.object({
      orderId: z.string(),
      orderType: z.enum(['product', 'extension'])
    })
  )
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    const { orderId, orderType } = input
    const bankTransferService = new BankTransferService(ctx.db)

    if (orderType === 'product') {
      // Complete the bank transfer flow (create membership/subscription)
      // Order status is managed by the handler based on payment type
      await bankTransferService.completeProductBankTransfer(orderId)
    } else {
      // Complete the bank transfer flow (extend membership/create subscription)
      // Order status is managed by the handler based on payment type
      await bankTransferService.completeExtensionBankTransfer(orderId)
    }

    return { success: true }
  })
