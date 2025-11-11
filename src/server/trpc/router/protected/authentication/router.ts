import { createTRPCRouter } from '~/server/trpc/config'
import { signOutProcedure } from '~/server/trpc/router/protected/authentication/procedures/sign-out'
import { updateUserProcedure } from '~/server/trpc/router/protected/authentication/procedures/update-user'

export const authenticationRouter = createTRPCRouter({
  signOut: signOutProcedure,
  updateUser: updateUserProcedure
})
