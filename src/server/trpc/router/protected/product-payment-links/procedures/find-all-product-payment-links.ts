import { TRPCError } from '@trpc/server'

import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'
import {
  ContractsTableValidators,
  ProductPaymentLinksTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

const output = ProductPaymentLinksTableValidators.select
  .extend({
    contract: ContractsTableValidators.select,
    createdBy: UsersTableValidators.select
  })
  .array()

export const findAllProductPaymentLinksProcedure = protectedProcedure
  .output(output)
  .query(async ({ ctx }) => {
    const isAdmin =
      ctx.session.user.role === UserRoles.ADMIN ||
      ctx.session.user.role === UserRoles.SUPER_ADMIN

    try {
      return await ctx.db.query.product_payment_links.findMany({
        orderBy: (paymentLinks, { asc }) => asc(paymentLinks.createdAt),
        where: (paymentLinks, { isNull, eq, and }) =>
          isAdmin
            ? isNull(paymentLinks.deletedAt)
            : and(
                isNull(paymentLinks.deletedAt),
                eq(paymentLinks.createdById, ctx.session.user.id)
              ),
        with: {
          contract: true,
          createdBy: true,
          product: true
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
