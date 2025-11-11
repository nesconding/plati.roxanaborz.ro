import { TRPCError } from '@trpc/server'

import { authentication } from '~/server/services/authentication'
import { protectedProcedure } from '~/server/trpc/config'

export const signOutProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  try {
    await authentication.api.signOut({
      headers: ctx.headers
    })
  } catch (cause) {
    throw new TRPCError({
      cause,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to sign out'
    })
  }
})
