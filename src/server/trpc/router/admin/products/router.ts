import { createTRPCRouter } from '~/server/trpc/config'
import { createOneProductProcedure } from '~/server/trpc/router/admin/products/procedures/create-one-product'
import { deleteOneProductByIdProcedure } from '~/server/trpc/router/admin/products/procedures/delete-one-product-by-id'
import { updateOneProductByIdProcedure } from '~/server/trpc/router/admin/products/procedures/update-one-product-by-id'

export const productsRouter = createTRPCRouter({
  createOne: createOneProductProcedure,
  deleteOne: deleteOneProductByIdProcedure,
  updateOne: updateOneProductByIdProcedure
})
