import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
  customSession,
  magicLink,
  phoneNumber
} from 'better-auth/plugins'
import z from 'zod'
import { database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { permissions } from '~/server/services/authentication/permissions'
import { EmailService } from '~/server/services/email'
import { UserRoles } from '~/shared/enums/user-roles'
import { SessionSchema } from '~/shared/validation/schemas/session'
import { UsersTableValidators } from '~/shared/validation/tables'

export const authentication = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      account: schema.users_accounts,
      session: schema.users_sessions,
      user: schema.users,
      verification: schema.verifications
    }
  }),

  plugins: [
    admin({
      ac: permissions.ac,
      adminRoles: [UserRoles.ADMIN, UserRoles.SUPER_ADMIN],
      defaultRole: UserRoles.USER,
      roles: permissions.roles
    }),
    phoneNumber({
      allowedAttempts: 3,
      callbackOnVerification: async ({ phoneNumber, user }, request) => {
        // Implement callback after phone number verification
        console.log({ phoneNumber, request, user })
      },
      sendOTP: ({ phoneNumber, code }, request) => {
        // Implement sending OTP code via SMS
        console.log({ code, phoneNumber, request })
      }
    }),
    magicLink({
      disableSignUp: true,
      sendMagicLink: EmailService.sendMagicLink
    }),

    //! this crashes the seeding script, comment it out to seed the database
    customSession(async (data) => SessionSchema.unwrap().parse(data)),

    // make sure this is the last plugin in the array
    nextCookies()
  ],

  user: {
    additionalFields: {
      firstName: {
        input: true,
        required: true,
        returned: true,
        sortable: true,
        type: 'string',
        validator: {
          input: z.string().min(3),
          output: z.string().min(3)
        }
      },
      invitedById: {
        input: false,
        required: false,
        returned: true,
        type: 'string',
        validator: {
          input: UsersTableValidators.insert.shape.invitedById,
          output: UsersTableValidators.select.shape.invitedById
        }
      },
      lastName: {
        input: true,
        required: true,
        returned: true,
        sortable: true,
        type: 'string',
        validator: {
          input: z.string().min(3),
          output: z.string().min(3)
        }
      }
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: EmailService.sendChangeEmailVerification
    }
  }
})
