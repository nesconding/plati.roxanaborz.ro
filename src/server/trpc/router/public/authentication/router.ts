import { createTRPCRouter } from '~/server/trpc/config'
import { getSessionProcedure } from '~/server/trpc/router/public/authentication/procedures/get-session'
import { signInProcedure } from '~/server/trpc/router/public/authentication/procedures/sign-in'

export const authenticationRouter = createTRPCRouter({
  getSession: getSessionProcedure,
  signIn: signInProcedure
})
