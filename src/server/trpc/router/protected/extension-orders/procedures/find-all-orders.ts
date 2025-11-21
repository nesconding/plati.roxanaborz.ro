import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import { ExtensionOrdersTableValidators } from '~/shared/validation/tables'

export const findAllExtensionOrdersProcedure = protectedProcedure
  .output(ExtensionOrdersTableValidators.select.array())
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
      const paymentLinks = await ctx.db.query.extension_payment_links.findMany({
        where: (extensionPaymentLinks, { and, eq, isNull }) =>
          and(
            eq(extensionPaymentLinks.createdById, ctx.session.user.id),
            isNull(extensionPaymentLinks.deletedAt)
          )
      })

      return await ctx.db.query.extension_orders.findMany({
        orderBy: (extensionOrders, { asc }) => asc(extensionOrders.createdAt),
        where: (extensionOrders, { and, inArray, isNull }) =>
          and(
            inArray(
              extensionOrders.extensionPaymentLinkId,
              paymentLinks.map((paymentLink) => paymentLink.id)
            ),
            isNull(extensionOrders.deletedAt)
          )
      })
    }

    return await ctx.db.query.extension_orders.findMany({
      orderBy: (extensionOrders, { asc }) => asc(extensionOrders.createdAt),
      where: (extensionOrders, { isNull }) => isNull(extensionOrders.deletedAt)
    })
  })
