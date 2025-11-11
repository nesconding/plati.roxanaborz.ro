import { createTRPCRouter } from '~/server/trpc/config'
import { authenticationRouter } from '~/server/trpc/router/admin/authentication/router'
import { productsRouter } from '~/server/trpc/router/admin/products/router'

export const adminRouter = createTRPCRouter({
  authentication: authenticationRouter,
  products: productsRouter
})
