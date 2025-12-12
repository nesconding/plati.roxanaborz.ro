import { TRPCError } from '@trpc/server'

import { protectedProcedure } from '~/server/trpc/config'
import { UserRoles } from '~/shared/enums/user-roles'

export const findAllScheduledEventsProcedure = protectedProcedure.query(
  ({ ctx }) => {
    try {
      if (
        ctx.session.user.role !== UserRoles.ADMIN &&
        ctx.session.user.role !== UserRoles.SUPER_ADMIN
      ) {
        return ctx.db.query.calendly_scheduled_events.findMany({
          orderBy: (calendly_scheduled_events, { asc }) =>
            asc(calendly_scheduled_events.createdAt),
          where: (calendly_scheduled_events, { eq }) =>
            eq(calendly_scheduled_events.closerEmail, ctx.session.user.email)
        })
      }

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
