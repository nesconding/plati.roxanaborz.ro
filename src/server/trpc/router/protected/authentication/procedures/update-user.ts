import { TRPCError } from '@trpc/server'
import { isValidPhoneNumber } from 'libphonenumber-js'
import z from 'zod'

import { protectedProcedure } from '~/server/trpc/config'

const input = z.object({
  email: z.email(),
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  phoneNumber: z.optional(
    z.string().refine((phoneNumber) => isValidPhoneNumber(phoneNumber))
  )
})

const output = z.object({
  verificationEmailSent: z.boolean()
})

export const updateUserProcedure = protectedProcedure
  .input(input)
  .output(output)
  .mutation(async ({ input, ctx }) => {
    try {
      const shouldChangeEmail = input.email !== ctx.session.user.email
      let changeEmailStatus: boolean = false

      if (shouldChangeEmail) {
        const { status } = await ctx.authentication.api.changeEmail({
          body: { callbackURL: '/', newEmail: input.email },
          headers: ctx.headers
        })
        changeEmailStatus = status
      }

      const phoneNumber =
        input.phoneNumber !== ctx.session.user.phoneNumber
          ? input.phoneNumber
          : undefined

      const firstName =
        input.firstName !== ctx.session.user.firstName
          ? input.firstName
          : undefined

      const lastName =
        input.lastName !== ctx.session.user.lastName
          ? input.lastName
          : undefined

      const fullName = `${firstName ?? input.firstName} ${lastName ?? input.lastName}`
      const name = fullName !== ctx.session.user.name ? fullName : undefined

      await ctx.authentication.api.updateUser({
        body: {
          firstName,
          lastName,
          name,
          phoneNumber
        },
        headers: ctx.headers
      })

      return {
        verificationEmailSent:
          shouldChangeEmail &&
          ctx.session.user.emailVerified &&
          changeEmailStatus
      }
    } catch (cause) {
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user'
      })
    }
  })
