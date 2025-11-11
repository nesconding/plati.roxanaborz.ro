import { createCallerFactory, createTRPCRouter } from '~/server/trpc/config'
import { adminRouter } from '~/server/trpc/router/admin/router'
import { protectedRouter } from '~/server/trpc/router/protected/index'
import { publicRouter } from '~/server/trpc/router/public/index'

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  protected: protectedRouter,
  public: publicRouter
})
export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
