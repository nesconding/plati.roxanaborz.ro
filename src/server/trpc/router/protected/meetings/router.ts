import { createTRPCRouter } from '~/server/trpc/config'
import { findAllMeetingsProcedure } from '~/server/trpc/router/protected/meetings/procedures/find-all-meetings'

export const meetingsRouter = createTRPCRouter({
  findAll: findAllMeetingsProcedure
})
