import { createTRPCRouter } from '~/server/trpc/config'
import { findAllMembershipsProcedure } from '~/server/trpc/router/protected/memberships/procedures/find-all-memberships'

export const membershipsRouter = createTRPCRouter({
  findAll: findAllMembershipsProcedure
})
