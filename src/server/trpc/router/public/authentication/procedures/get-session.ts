import { publicProcedure } from '~/server/trpc/config'
import { SessionSchema } from '~/shared/validation/schemas/session'

const output = SessionSchema

export const getSessionProcedure = publicProcedure
  .output(output)
  .query(({ ctx }) => ctx.session)
