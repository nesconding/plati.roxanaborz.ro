import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { memberships } from '~/server/database/schema/business/models/membership'
import { protectedProcedure } from '~/server/trpc/config'

const inputSchema = z.object({
  memberships: z.array(
    z.object({
      delayedStartDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional(),
      id: z.string(),
      startDate: z.string().datetime().optional()
    })
  )
})

export const bulkUpdateMembershipDatesProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const { memberships: membershipUpdates } = input

    const results = await Promise.all(
      membershipUpdates.map(async (update) => {
        try {
          // Verify membership exists
          const membership = await ctx.db.query.memberships.findFirst({
            where: (memberships, { eq }) => eq(memberships.id, update.id)
          })

          if (!membership) {
            return {
              error: 'Membership not found',
              id: update.id,
              success: false
            }
          }

          // Validate dates
          if (update.startDate && update.endDate) {
            const start = new Date(update.startDate)
            const end = new Date(update.endDate)
            if (start >= end) {
              return {
                error: 'End date must be after start date',
                id: update.id,
                success: false
              }
            }
          }

          // Validate delayedStartDate if provided
          if (update.delayedStartDate && update.startDate) {
            const delayed = new Date(update.delayedStartDate)
            const start = new Date(update.startDate)
            if (delayed > start) {
              return {
                error:
                  'Delayed start date must be before or equal to start date',
                id: update.id,
                success: false
              }
            }
          }

          // Build update object
          const updateData: Record<string, unknown> = {}
          if (update.startDate !== undefined)
            updateData.startDate = update.startDate
          if (update.endDate !== undefined) updateData.endDate = update.endDate
          if (update.delayedStartDate !== undefined)
            updateData.delayedStartDate = update.delayedStartDate

          // Update membership
          await ctx.db
            .update(memberships)
            .set(updateData)
            .where(eq(memberships.id, update.id))

          return { id: update.id, success: true }
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            id: update.id,
            success: false
          }
        }
      })
    )

    const successCount = results.filter((r) => r.success).length
    const errors = results.filter((r) => !r.success)

    return {
      errors,
      message: `Successfully updated ${successCount} out of ${membershipUpdates.length} memberships`,
      successCount
    }
  })
