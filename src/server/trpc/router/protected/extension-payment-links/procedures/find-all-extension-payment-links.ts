import { TRPCError } from '@trpc/server'

import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import {
  ExtensionPaymentLinksTableValidators,
  MembershipsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

const output = ExtensionPaymentLinksTableValidators.select
  .extend({
    createdBy: UsersTableValidators.select,
    membership: MembershipsTableValidators.select
  })
  .array()

export const findAllExtensionPaymentLinksProcedure = protectedProcedure
  .output(output)
  .query(async ({ ctx }) => {
    const isAdmin =
      ctx.session.user.role === UserRoles.ADMIN ||
      ctx.session.user.role === UserRoles.SUPER_ADMIN

    try {
      return await ctx.db.query.extension_payment_links.findMany({
        orderBy: (paymentLinks, { asc }) => asc(paymentLinks.createdAt),
        where: (paymentLinks, { isNull, eq, and }) =>
          isAdmin
            ? isNull(paymentLinks.deletedAt)
            : and(
                isNull(paymentLinks.deletedAt),
                eq(paymentLinks.createdById, ctx.session.user.id)
              ),
        with: {
          createdBy: true,
          membership: true
        }
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all payment links'
      })
    }
  })
