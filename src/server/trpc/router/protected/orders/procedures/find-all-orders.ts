import z from 'zod'
import { DatesService } from '~/server/services/dates'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import {
  ExtensionOrdersTableValidators,
  ProductOrdersTableValidators
} from '~/shared/validation/tables'

export const findAllOrdersProcedure = protectedProcedure
  .output(
    z
      .union([
        ProductOrdersTableValidators.select,
        ExtensionOrdersTableValidators.select
      ])
      .array()
  )
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
      const [paymentLinks, extensionPaymentLinks] = await Promise.all([
        ctx.db.query.product_payment_links.findMany({
          where: (productPaymentLinks, { and, eq, isNull }) =>
            and(
              eq(productPaymentLinks.createdById, ctx.session.user.id),
              isNull(productPaymentLinks.deletedAt)
            )
        }),
        ctx.db.query.extension_payment_links.findMany({
          where: (extensionPaymentLinks, { and, eq, isNull }) =>
            and(
              eq(extensionPaymentLinks.createdById, ctx.session.user.id),
              isNull(extensionPaymentLinks.deletedAt)
            )
        })
      ])

      const paymentLinkIds = paymentLinks.map((pl) => pl.id)
      const extensionPaymentLinkIds = extensionPaymentLinks.map((epl) => epl.id)

      const [productOrders, extensionOrders] = await Promise.all([
        ctx.db.query.product_orders.findMany({
          where: (productOrders, { and, inArray, isNull }) =>
            and(
              inArray(productOrders.productPaymentLinkId, paymentLinkIds),
              isNull(productOrders.deletedAt)
            )
        }),
        ctx.db.query.extension_orders.findMany({
          where: (extensionOrders, { and, inArray, isNull }) =>
            and(
              inArray(
                extensionOrders.extensionPaymentLinkId,
                extensionPaymentLinkIds
              ),
              isNull(extensionOrders.deletedAt)
            )
        })
      ])

      return [...productOrders, ...extensionOrders].sort((a, b) =>
        DatesService.isAfter(a.createdAt, b.createdAt) ? 1 : -1
      )
    }

    const [productOrders, extensionOrders] = await Promise.all([
      ctx.db.query.product_orders.findMany({
        orderBy: (productOrders, { asc }) => asc(productOrders.createdAt),
        where: (productOrders, { isNull }) => isNull(productOrders.deletedAt)
      }),
      ctx.db.query.extension_orders.findMany({
        orderBy: (extensionOrders, { asc }) => asc(extensionOrders.createdAt),
        where: (extensionOrders, { isNull }) =>
          isNull(extensionOrders.deletedAt)
      })
    ])

    return [...productOrders, ...extensionOrders].sort((a, b) =>
      DatesService.isAfter(a.createdAt, b.createdAt) ? 1 : -1
    )
  })
