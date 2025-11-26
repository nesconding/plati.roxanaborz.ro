import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { memberships } from '~/server/database/schema/business/models/membership'
import { protectedProcedure } from '~/server/trpc/config'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

const inputSchema = z.object({
  id: z.string().min(1, 'Membership ID is required'),
  status: z.nativeEnum(MembershipStatusType)
})

export const updateMembershipStatusProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, status } = input

    // Prevent manual selection of Paused status (system only)
    if (status === MembershipStatusType.Paused) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Cannot manually set membership to Paused. This status is automatically set by the system when subscription payments fail.'
      })
    }

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

    // Update membership status
    await ctx.db
      .update(memberships)
      .set({ status })
      .where(eq(memberships.id, id))

    return {
      message: `Membership status updated to ${status}`,
      success: true
    }
  })
