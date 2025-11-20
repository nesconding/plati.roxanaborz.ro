import { createTRPCRouter } from '~/server/trpc/config'
import { findAllScheduledEventsProcedure } from '~/server/trpc/router/protected/scheduled-events/procedures/find-all-scheduled-events'

export const scheduledEventsRouter = createTRPCRouter({
  findAll: findAllScheduledEventsProcedure
})
