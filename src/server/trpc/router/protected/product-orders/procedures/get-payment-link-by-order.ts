import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import { ProductPaymentLinksTableValidators } from '~/shared/validation/tables'

export const getPaymentLinkByOrderProcedure = protectedProcedure
  .input(
    z.object({
      orderId: z.string()
    })
  )
  .output(ProductPaymentLinksTableValidators.select)
  .query(async ({ ctx, input }) => {
    const { orderId } = input

    // Fetch order with payment link relation
    const order = await ctx.db.query.product_orders.findFirst({
      where: (product_orders, { eq }) => eq(product_orders.id, orderId),
      with: {
        productPaymentLink: {
          with: {
            product: true
          }
        }
      }
    })

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Order not found: ${orderId}`
      })
    }

    if (!order.productPaymentLink) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Payment link not found for order: ${orderId}`
      })
    }

    // Authorization check: user must own the payment link OR be admin
    const isAdmin =
      ctx.session.user.role === UserRoles.ADMIN ||
      ctx.session.user.role === UserRoles.SUPER_ADMIN
    const isOwner = order.productPaymentLink.createdById === ctx.session.user.id

    if (!isAdmin && !isOwner) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this payment link'
      })
    }

    return order.productPaymentLink
  })
