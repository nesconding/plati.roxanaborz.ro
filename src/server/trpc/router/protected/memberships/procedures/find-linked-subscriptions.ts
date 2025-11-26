import { TRPCError } from '@trpc/server'

import { z } from 'zod'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const inputSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required')
})

export const findLinkedSubscriptionsProcedure = protectedProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    const { membershipId } = input

    // Verify membership exists and belongs to user
    const membership = await ctx.db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.id, membershipId)
    })

    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Membership not found'
      })
    }

    // Check ownership - admins can view any membership
    const isAdmin =
      ctx.session.user.role === UserRoles.ADMIN ||
      ctx.session.user.role === UserRoles.SUPER_ADMIN
    const isOwner = membership.customerEmail === ctx.session.user.email

    if (!isAdmin && !isOwner) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only view your own memberships'
      })
    }

    // Fetch all product subscriptions linked to this membership
    const productSubscriptions =
      await ctx.db.query.product_subscriptions.findMany({
        where: (product_subscriptions, { eq }) =>
          eq(product_subscriptions.membershipId, membershipId)
      })

    // Fetch all extension subscriptions linked to this membership
    const extensionSubscriptions =
      await ctx.db.query.extension_subscriptions.findMany({
        where: (extension_subscriptions, { eq }) =>
          eq(extension_subscriptions.membershipId, membershipId)
      })

    return {
      extensionSubscriptions,
      productSubscriptions
    }
  })
