import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import { ExtensionSubscriptionsTableValidators } from '~/shared/validation/tables'

export const findAllExtensionsSubscriptionsProcedure = protectedProcedure
  .output(ExtensionSubscriptionsTableValidators.select.array())
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
      const extensionPaymentLinks =
        await ctx.db.query.extension_payment_links.findMany({
          where: (extensionPaymentLinks, { and, eq, isNull }) =>
            and(
              eq(extensionPaymentLinks.createdById, ctx.session.user.id),
              isNull(extensionPaymentLinks.deletedAt)
            )
        })

      const memberships = await ctx.db.query.memberships.findMany({
        orderBy: (memberships, { asc }) => asc(memberships.createdAt),
        where: (memberships, { and, inArray, isNull }) =>
          and(
            inArray(
              memberships.parentOrderId,
              extensionPaymentLinks.map(({ id }) => id)
            ),
            isNull(memberships.deletedAt)
          )
      })
      const membershipIds = memberships.map(({ id }) => id)

      return await ctx.db.query.extension_subscriptions.findMany({
        where: (extensionSubscriptions, { and, inArray, isNull }) =>
          and(
            inArray(extensionSubscriptions.membershipId, membershipIds),
            isNull(extensionSubscriptions.deletedAt)
          )
      })
    }

    return await ctx.db.query.extension_subscriptions.findMany({
      orderBy: (extensionSubscriptions, { asc }) =>
        asc(extensionSubscriptions.createdAt),
      where: (extensionSubscriptions, { isNull }) =>
        isNull(extensionSubscriptions.deletedAt)
    })
  })
