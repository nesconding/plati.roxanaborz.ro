import { TRPCError } from '@trpc/server'
import z from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { CreateUserSchema } from '~/shared/validation/schemas/user/create-user'

export const createUserProcedure = adminProcedure
  .input(CreateUserSchema)
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.authentication.api.createUser({
        body: {
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber:
              input.phoneNumber === '' ? undefined : input.phoneNumber
          },
          email: input.email,
          name: `${input.firstName} ${input.lastName}`,
          password: 'no-password'
        },
        headers: ctx.headers
      })
    } catch (cause) {
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user'
      })
    }
  })
