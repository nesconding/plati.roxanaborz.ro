import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import z from 'zod'

import { contracts } from '~/server/database/schema'
import { adminProcedure } from '~/server/trpc/config'

const input = z.object({
  id: z.string()
})

export const deleteOneContractProcedure = adminProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    try {
      const deletedAt = new Date().toISOString()

      await ctx.db
        .update(contracts)
        .set({ deletedAt })
        .where(eq(contracts.id, input.id))
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete contract'
      })
    }
  })
