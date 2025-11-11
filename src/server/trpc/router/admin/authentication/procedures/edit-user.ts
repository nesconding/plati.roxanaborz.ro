import { TRPCError } from '@trpc/server'
import { isValidPhoneNumber } from 'libphonenumber-js'
import z from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

const input = z.object({
  email: z.email(),
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  phoneNumber: z.optional(
    z.string().refine((phoneNumber) => isValidPhoneNumber(phoneNumber))
  ),
  userId: z.string()
})
const output = z.void()

export const editUserProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'This is used only for admins to edit a user. To update your own profile you should use the account settings'
        })
      }

      const user = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, input.userId)
      })
      if (!user)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })

      if (user.role === UserRoles.SUPER_ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot edit super administrators'
        })
      }

      if (
        user.role === UserRoles.ADMIN &&
        ctx.session.user.role !== UserRoles.SUPER_ADMIN
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not enough permissions to edit administrators'
        })
      }

      if (input.email) {
        const existingUser = await ctx.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, input.email)
        })
        if (existingUser && existingUser.id !== input.userId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use'
          })
        }
      }

      await ctx.authentication.api.adminUpdateUser({
        body: {
          data: { ...input, name: `${input.firstName} ${input.lastName}` },
          userId: input.userId
        },
        headers: ctx.headers
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to edit user'
      })
    }
  })
