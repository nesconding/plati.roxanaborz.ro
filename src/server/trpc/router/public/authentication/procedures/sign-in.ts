import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure } from '~/server/trpc/config'

const input = z.object({
  email: z.email()
})

export const signInProcedure = publicProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    try {
      await ctx.authentication.api.signInMagicLink({
        body: { email: input.email },
        headers: ctx.headers
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sign in'
      })
    }
  })
