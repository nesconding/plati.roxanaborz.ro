import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  userId: z.string()
})
const output = z.void()

export const unbanUserProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      const user = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, input.userId)
      })
      if (
        user?.role === UserRoles.ADMIN &&
        ctx.session.user.role !== UserRoles.SUPER_ADMIN
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not enough permissions to unban administrators'
        })
      }

      await ctx.authentication.api.unbanUser({
        body: { userId: input.userId },
        headers: ctx.headers
      })
    } catch (cause) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to unban user',
        cause
      })
    }
  })
