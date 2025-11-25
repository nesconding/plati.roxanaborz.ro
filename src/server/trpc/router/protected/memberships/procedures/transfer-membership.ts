import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { memberships } from '~/server/database/schema/business/models/membership'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { protectedProcedure } from '~/server/trpc/config'

const inputSchema = z.object({
  id: z.string().min(1, 'Membership ID is required'),
  newEmail: z.string().email('Must be a valid email address')
})

export const transferMembershipProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, newEmail } = input

    // Verify membership exists
    const membership = await ctx.db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.id, id)
    })

    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Membership not found'
      })
    }

    // Transfer membership to new email
    await ctx.db
      .update(memberships)
      .set({
        customerEmail: newEmail
      })
      .where(eq(memberships.id, id))

    // Also update any associated subscriptions
    // Update product subscriptions
    await ctx.db
      .update(product_subscriptions)
      .set({
        customerEmail: newEmail
      })
      .where(eq(product_subscriptions.membershipId, id))

    // Update extension subscriptions
    await ctx.db
      .update(extension_subscriptions)
      .set({
        customerEmail: newEmail
      })
      .where(eq(extension_subscriptions.membershipId, id))

    return {
      message: `Membership transferred to ${newEmail}`,
      success: true
    }
  })
