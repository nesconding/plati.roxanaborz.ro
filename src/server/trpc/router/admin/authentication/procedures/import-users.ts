import { TRPCError } from '@trpc/server'
import { isValidPhoneNumber } from 'libphonenumber-js'
import z from 'zod'

import { adminProcedure } from '~/server/trpc/config'
import { UsersTableValidators } from '~/shared/validation/tables'

const input = z.array(
  z.object({
    email: z.email(),
    firstName: z.string().min(3),
    lastName: z.string().min(3),
    phoneNumber: z.optional(
      z.string().refine((phoneNumber) => isValidPhoneNumber(phoneNumber))
    )
  })
)
const output = z.array(
  z.object({
    data: z.object({
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z.string().optional()
    }),
    duplicateOfUser: UsersTableValidators.select
  })
)

export const importUsersProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      const existingUsers = await ctx.db.query.users.findMany({
        where: (users, { inArray }) =>
          inArray(
            users.email,
            input.map((user) => user.email)
          )
      })

      const newUsersDataWithDuplicates = input.map((data) => ({
        data,
        duplicateOfUser: existingUsers.find(
          (existingUser) => existingUser.email === data.email
        )
      }))

      const newUsersToCreate = newUsersDataWithDuplicates.filter(
        (user) => user.duplicateOfUser === undefined
      )

      await Promise.all(
        newUsersToCreate.map(({ data }) =>
          ctx.authentication.api.createUser({
            body: {
              name: `${data.firstName} ${data.lastName}`,
              password: 'no-password',
              email: data.email,
              data: {
                phoneNumber: data.phoneNumber,
                firstName: data.firstName,
                lastName: data.lastName
              }
            },
            headers: ctx.headers
          })
        )
      )

      const newUsersWithDuplicates = newUsersDataWithDuplicates.filter(
        (user) => user.duplicateOfUser !== undefined
      ) as z.infer<typeof output>

      return newUsersWithDuplicates
    } catch (cause) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import users',
        cause
      })
    }
  })
