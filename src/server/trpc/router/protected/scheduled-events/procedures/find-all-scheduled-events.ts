import { TRPCError } from '@trpc/server'

import { protectedProcedure } from '~/server/trpc/config'

export const findAllScheduledEventsProcedure = protectedProcedure.query(
  ({ ctx }) => {
    try {
      return ctx.db.query.calendly_scheduled_events.findMany({
        orderBy: (calendly_scheduled_events, { asc }) =>
          asc(calendly_scheduled_events.createdAt)
      })
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all scheduledEvents'
      })
    }
  }
)
