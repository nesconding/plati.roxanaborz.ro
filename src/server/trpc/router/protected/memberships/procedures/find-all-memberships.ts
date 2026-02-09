import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import {
  MembershipsTableValidators,
  ProductOrdersTableValidators,
  ProductPaymentLinksTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

export const findAllMembershipsProcedure = protectedProcedure
  .output(
    MembershipsTableValidators.select
      .extend({
        parentOrder: ProductOrdersTableValidators.select
          .extend({
            productPaymentLink:
              ProductPaymentLinksTableValidators.select.extend({
                product: ProductsTableValidators.select
              })
          })
          .nullable()
      })
      .array()
  )
  .query(async ({ ctx }) => {
    if (ctx.session.user.role === UserRoles.USER) {
      const [productPaymentLinks, extensionPaymentLinks] = await Promise.all([
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

      const paymentLinkIds = [
        ...productPaymentLinks.map(({ id }) => id),
        ...extensionPaymentLinks.map(({ id }) => id)
      ]

      return await ctx.db.query.memberships.findMany({
        orderBy: (memberships, { asc }) => asc(memberships.createdAt),
        where: (memberships, { and, inArray, isNull }) =>
          and(
            inArray(memberships.parentOrderId, paymentLinkIds),
            isNull(memberships.deletedAt)
          ),
        with: {
          parentOrder: {
            with: { productPaymentLink: { with: { product: true } } }
          }
        }
      })
    }

    return await ctx.db.query.memberships.findMany({
      orderBy: (memberships, { asc }) => asc(memberships.createdAt),
      where: (memberships, { isNull }) => isNull(memberships.deletedAt),
      with: {
        parentOrder: {
          with: { productPaymentLink: { with: { product: true } } }
        }
      }
    })
  })
