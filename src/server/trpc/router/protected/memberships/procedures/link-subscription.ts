import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const inputSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  subscriptionType: z.enum(['product', 'extension'])
})

export const linkMembershipSubscriptionProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { membershipId, subscriptionId, subscriptionType } = input

    // Verify membership exists
    const membership = await ctx.db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.id, membershipId)
    })

    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Membership not found'
      })
    }

    // Check ownership - admins can link any membership
    const isAdmin =
      ctx.session.user.role === UserRoles.ADMIN ||
      ctx.session.user.role === UserRoles.SUPER_ADMIN
    const isMembershipOwner =
      membership.customerEmail === ctx.session.user.email

    if (!isAdmin && !isMembershipOwner) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only link your own memberships'
      })
    }

    // Verify subscription exists
    if (subscriptionType === 'product') {
      const subscription = await ctx.db.query.product_subscriptions.findFirst({
        where: (product_subscriptions, { eq }) =>
          eq(product_subscriptions.id, subscriptionId)
      })

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found'
        })
      }

      // Check ownership - admins can link any subscription
      const isSubscriptionOwner =
        subscription.customerEmail === ctx.session.user.email

      if (!isAdmin && !isSubscriptionOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only link your own subscriptions'
        })
      }

      // Check if subscription is already linked to a different membership
      if (
        subscription.membershipId &&
        subscription.membershipId !== membershipId
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Subscription is already linked to a different membership. Unlink it first before linking to a new membership.'
        })
      }

      // Update subscription to link to this membership
      await ctx.db
        .update(product_subscriptions)
        .set({ membershipId })
        .where(eq(product_subscriptions.id, subscriptionId))
    } else {
      const subscription = await ctx.db.query.extension_subscriptions.findFirst(
        {
          where: (extension_subscriptions, { eq }) =>
            eq(extension_subscriptions.id, subscriptionId)
        }
      )

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found'
        })
      }

      // Check ownership - admins can link any subscription
      const isSubscriptionOwner =
        subscription.customerEmail === ctx.session.user.email

      if (!isAdmin && !isSubscriptionOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only link your own subscriptions'
        })
      }

      // Check if subscription is already linked to a different membership
      if (
        subscription.membershipId &&
        subscription.membershipId !== membershipId
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Subscription is already linked to a different membership. Unlink it first before linking to a new membership.'
        })
      }

      // Update subscription to link to this membership
      await ctx.db
        .update(extension_subscriptions)
        .set({ membershipId })
        .where(eq(extension_subscriptions.id, subscriptionId))
    }

    return {
      message: 'Subscription linked to membership successfully',
      success: true
    }
  })
