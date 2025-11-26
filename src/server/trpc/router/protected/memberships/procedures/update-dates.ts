import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { memberships } from '~/server/database/schema/business/models/membership'
import { protectedProcedure } from '~/server/trpc/config'

const inputSchema = z.object({
  delayedStartDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional(),
  id: z.string().min(1, 'Membership ID is required'),
  startDate: z.string().datetime().optional()
})

export const updateMembershipDatesProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, startDate, endDate, delayedStartDate } = input

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

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start >= end) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End date must be after start date'
        })
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (startDate !== undefined) updateData.startDate = startDate
    if (endDate !== undefined) updateData.endDate = endDate
    if (delayedStartDate !== undefined)
      updateData.delayedStartDate = delayedStartDate

    // Update membership
    await ctx.db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))

    return {
      message: 'Membership dates updated successfully',
      success: true
    }
  })
