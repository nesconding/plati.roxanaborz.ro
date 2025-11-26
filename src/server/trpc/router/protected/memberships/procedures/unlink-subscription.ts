import { TRPCError } from '@trpc/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const inputSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  subscriptionType: z.enum(['product', 'extension'])
})

export const unlinkMembershipSubscriptionProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { subscriptionId, subscriptionType } = input

    // Verify subscription exists and validate ownership
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

      // Check ownership - admins can unlink any subscription
      const isAdmin =
        ctx.session.user.role === UserRoles.ADMIN ||
        ctx.session.user.role === UserRoles.SUPER_ADMIN
      const isOwner = subscription.customerEmail === ctx.session.user.email

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only unlink your own subscriptions'
        })
      }

      // Unlink subscription by setting membershipId to null
      await ctx.db
        .update(product_subscriptions)
        .set({ membershipId: null })
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

      // Check ownership - admins can unlink any subscription
      const isAdmin =
        ctx.session.user.role === UserRoles.ADMIN ||
        ctx.session.user.role === UserRoles.SUPER_ADMIN
      const isOwner = subscription.customerEmail === ctx.session.user.email

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only unlink your own subscriptions'
        })
      }

      // Unlink subscription by setting membershipId to null
      await ctx.db
        .update(extension_subscriptions)
        .set({ membershipId: null })
        .where(eq(extension_subscriptions.id, subscriptionId))
    }

    return {
      message: 'Subscription unlinked from membership successfully',
      success: true
    }
  })
