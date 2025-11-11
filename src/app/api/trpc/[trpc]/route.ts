import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { createTRPCContext } from '~/server/trpc/config'
import { appRouter } from '~/server/trpc/router'

const handler = (req: Request) =>
  fetchRequestHandler({
    createContext: () => createTRPCContext({ headers: req.headers }),
    endpoint: '/api/trpc',
    req,
    router: appRouter
  })
export { handler as GET, handler as POST }
