import z from 'zod'
import { DatesService } from '~/server/services/dates'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import {
  ExtensionSubscriptionsTableValidators,
  ProductSubscriptionsTableValidators
} from '~/shared/validation/tables'

type asd = typeof ExtensionSubscriptionsTableValidators.$types.select

export const findAllSubscriptionsProcedure = protectedProcedure
  .output(
    z
      .union([
        ProductSubscriptionsTableValidators.select,
        ExtensionSubscriptionsTableValidators.select
      ])
      .array()
  )
  .query(async ({ ctx }) => {
    if (
      ctx.session.user.role !== UserRoles.ADMIN &&
      ctx.session.user.role !== UserRoles.SUPER_ADMIN
    ) {
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

      const memberships = await ctx.db.query.memberships.findMany({
        orderBy: (memberships, { asc }) => asc(memberships.createdAt),
        where: (memberships, { and, inArray, isNull }) =>
          and(
            inArray(memberships.parentOrderId, paymentLinkIds),
            isNull(memberships.deletedAt)
          )
      })
      const membershipIds = memberships.map(({ id }) => id)

      const [productSubscriptions, extensionSubscriptions] = await Promise.all([
        ctx.db.query.product_subscriptions.findMany({
          where: (productSubscriptions, { and, inArray, isNull }) =>
            and(
              inArray(productSubscriptions.membershipId, membershipIds),
              isNull(productSubscriptions.deletedAt)
            )
        }),
        ctx.db.query.extension_subscriptions.findMany({
          where: (extensionSubscriptions, { and, inArray, isNull }) =>
            and(
              inArray(extensionSubscriptions.membershipId, membershipIds),
              isNull(extensionSubscriptions.deletedAt)
            )
        })
      ])

      return [...productSubscriptions, ...extensionSubscriptions].sort(
        (a, b) => (DatesService.isAfter(a.createdAt, b.createdAt) ? 1 : -1)
      )
    }

    const [productSubscriptions, extensionSubscriptions] = await Promise.all([
      ctx.db.query.product_subscriptions.findMany({
        orderBy: (productSubscriptions, { asc }) =>
          asc(productSubscriptions.createdAt),
        where: (productSubscriptions, { isNull }) =>
          isNull(productSubscriptions.deletedAt)
      }),
      ctx.db.query.extension_subscriptions.findMany({
        orderBy: (extensionSubscriptions, { asc }) =>
          asc(extensionSubscriptions.createdAt),
        where: (extensionSubscriptions, { isNull }) =>
          isNull(extensionSubscriptions.deletedAt)
      })
    ])
    return [...productSubscriptions, ...extensionSubscriptions].sort((a, b) =>
      DatesService.isAfter(a.createdAt, b.createdAt) ? 1 : -1
    )
  })
