import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  userId: z.string()
})
const output = z.void()

export const promoteUserProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      if (ctx.session.user.role !== UserRoles.SUPER_ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not enough permissions to promote user'
        })
      }

      await ctx.authentication.api.adminUpdateUser({
        body: { data: { role: UserRoles.ADMIN }, userId: input.userId },
        headers: ctx.headers
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to promote user'
      })
    }
  })
