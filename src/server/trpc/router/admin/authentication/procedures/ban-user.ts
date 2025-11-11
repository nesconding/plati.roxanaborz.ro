import { TRPCError } from '@trpc/server'
import { differenceInSeconds } from 'date-fns'
import { z } from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  banExpireDate: z.iso.datetime().optional(),
  banReason: z.string().optional(),
  userId: z.string()
})
const output = z.void()

export const banUserProcedure = adminProcedure
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
          message: 'Not enough permissions to ban administrators'
        })
      }

      await ctx.authentication.api.banUser({
        body: {
          banExpiresIn: input.banExpireDate
            ? differenceInSeconds(input.banExpireDate, new Date())
            : undefined,
          banReason: input.banReason,
          userId: input.userId
        },
        headers: ctx.headers
      })
      await ctx.authentication.api.revokeUserSessions({
        body: { userId: input.userId },
        headers: ctx.headers
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to ban user'
      })
    }
  })
