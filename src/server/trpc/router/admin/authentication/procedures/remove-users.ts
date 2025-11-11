import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  usersIds: z.array(z.string())
})
const output = z.object({
  failedResults: z.array(
    z.object({
      error: z.unknown(),
      success: z.boolean(),
      userId: z.string()
    })
  ),
  removedCount: z.number()
})

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

      const results = await Promise.all(
        input.usersIds.map(async (userId) => {
          try {
            await Promise.all([
              ctx.authentication.api.removeUser({
                body: { userId: userId },
                headers: ctx.headers
              }),
              ctx.authentication.api.revokeUserSessions({
                body: { userId },
                headers: ctx.headers
              })
            ])
            return { error: undefined, success: true, userId }
          } catch (error) {
            return { error, success: false, userId }
          }
        })
      )
      const removedCount = results.filter((result) => result.success).length
      const failedResults = results.filter((result) => !result.success)

      return { failedResults, removedCount }
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove users'
      })
    }
  })
