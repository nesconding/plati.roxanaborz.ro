import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import z from 'zod'

import { contracts } from '~/server/database/schema'
import { adminProcedure } from '~/server/trpc/config'

const input = z.object({
  id: z.string(),
  name: z.string().min(1)
})

export const updateOneContractProcedure = adminProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db
        .update(contracts)
        .set({ name: input.name })
        .where(eq(contracts.id, input.id))
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update contract'
      })
    }
  })
