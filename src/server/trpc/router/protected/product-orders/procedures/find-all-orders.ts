import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import { ProductOrdersTableValidators } from '~/shared/validation/tables'

export const findAllProductOrdersProcedure = protectedProcedure
  .output(ProductOrdersTableValidators.select.array())
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
      const paymentLinks = await ctx.db.query.product_payment_links.findMany({
        where: (productPaymentLinks, { and, eq, isNull }) =>
          and(
            eq(productPaymentLinks.createdById, ctx.session.user.id),
            isNull(productPaymentLinks.deletedAt)
          )
      })

      return await ctx.db.query.product_orders.findMany({
        orderBy: (productOrders, { asc }) => asc(productOrders.createdAt),
        where: (productOrders, { and, inArray, isNull }) =>
          and(
            inArray(
              productOrders.productPaymentLinkId,
              paymentLinks.map((paymentLink) => paymentLink.id)
            ),
            isNull(productOrders.deletedAt)
          )
      })
    }

    return await ctx.db.query.product_orders.findMany({
      orderBy: (productOrders, { asc }) => asc(productOrders.createdAt),
      where: (productOrders, { isNull }) => isNull(productOrders.deletedAt)
    })
  })
