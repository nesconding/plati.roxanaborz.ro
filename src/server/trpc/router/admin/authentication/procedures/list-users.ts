import { TRPCError } from '@trpc/server'
import z from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UsersTableValidators } from '~/shared/validation/tables'

const input = z.void()
const output = z.array(
  UsersTableValidators.select.extend({
    invitedBy: UsersTableValidators.select.nullable()
  })
)

export const listUsersProcedure = adminProcedure
  .input(input)
  .output(output)
  .query(async ({ ctx }) => {
    try {
      return await ctx.db.query.users.findMany({ with: { invitedBy: true } })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list users'
      })
    }
  })
