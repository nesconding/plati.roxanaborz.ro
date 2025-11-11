import { createTRPCRouter } from '~/server/trpc/config'
import { findAllProductsProcedure } from '~/server/trpc/router/protected/products/procedures/find-all-products'
import { findOneProductByIdProcedure } from '~/server/trpc/router/protected/products/procedures/find-one-product-by-id'

export const productsRouter = createTRPCRouter({
  findAll: findAllProductsProcedure,
  findOneById: findOneProductByIdProcedure
})
