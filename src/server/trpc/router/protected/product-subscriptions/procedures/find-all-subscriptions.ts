import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import { ProductSubscriptionsTableValidators } from '~/shared/validation/tables'

export const findAllProductSubscriptionsProcedure = protectedProcedure
  .output(ProductSubscriptionsTableValidators.select.array())
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
      const productPaymentLinks =
        await ctx.db.query.product_payment_links.findMany({
          where: (productPaymentLinks, { and, eq, isNull }) =>
            and(
              eq(productPaymentLinks.createdById, ctx.session.user.id),
              isNull(productPaymentLinks.deletedAt)
            )
        })

      const memberships = await ctx.db.query.memberships.findMany({
        orderBy: (memberships, { asc }) => asc(memberships.createdAt),
        where: (memberships, { and, inArray, isNull }) =>
          and(
            inArray(
              memberships.parentOrderId,
              productPaymentLinks.map(({ id }) => id)
            ),
            isNull(memberships.deletedAt)
          )
      })
      const membershipIds = memberships.map(({ id }) => id)

      return await ctx.db.query.product_subscriptions.findMany({
        where: (productSubscriptions, { and, inArray, isNull }) =>
          and(
            inArray(productSubscriptions.membershipId, membershipIds),
            isNull(productSubscriptions.deletedAt)
          )
      })
    }

    return await ctx.db.query.product_subscriptions.findMany({
      orderBy: (productSubscriptions, { asc }) =>
        asc(productSubscriptions.createdAt),
      where: (productSubscriptions, { isNull }) =>
        isNull(productSubscriptions.deletedAt)
    })
  })
