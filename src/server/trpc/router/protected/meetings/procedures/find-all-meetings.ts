import { TRPCError } from '@trpc/server'
import { MeetingsService } from '~/server/services/meetings'

import { protectedProcedure } from '~/server/trpc/config'

export const findAllMeetingsProcedure = protectedProcedure.query(() => {
  try {
    return MeetingsService.findAllMeetings()
  } catch (cause) {
    throw new TRPCError({
      cause,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to find all meetings'
    })
  }
})
