import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  usersIds: z.array(z.string())
})
const output = z.void()

export const removeUsersProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      const users = await ctx.db.query.users.findMany({
        where: (users, { inArray }) => inArray(users.id, input.usersIds)
      })
      if (
        users.some(
          (user) =>
            user.role === UserRoles.ADMIN &&
            ctx.session.user.role !== UserRoles.SUPER_ADMIN
        )
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not enough permissions to remove administrators'
        })
      }

      await Promise.all(
        input.usersIds.map((userId) =>
          ctx.authentication.api.removeUser({
            body: { userId: userId },
            headers: ctx.headers
          })
        )
      )
    } catch (cause) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove users',
        cause
      })
    }
  })
