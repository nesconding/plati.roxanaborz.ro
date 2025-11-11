import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure } from '~/server/trpc/config'
import {
  ProductsExtensionsInstallmentsTableValidators,
  ProductsExtensionsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

const input = z.object({
  productId: z.string()
})
const output = ProductsTableValidators.select
  .extend({
    extensions: z.array(
      ProductsExtensionsTableValidators.select.extend({
        installments: z.array(
          ProductsExtensionsInstallmentsTableValidators.select
        )
      })
    ),
    installments: z.array(ProductsInstallmentsTableValidators.select)
  })
  .nullable()

export const findOneProductByIdProcedure = protectedProcedure
  .input(input)
  .output(output)
  .query(async ({ ctx, input }) => {
    try {
      const product = await ctx.db.query.products.findFirst({
        orderBy: (products, { asc }) => asc(products.createdAt),
        where: (products, { and, eq, isNull }) =>
          and(eq(products.id, input.productId), isNull(products.deletedAt)),
        with: {
          extensions: {
            with: {
              installments: {
                orderBy: (products_extensions_installments, { asc }) =>
                  asc(products_extensions_installments.createdAt),
                where: (products_extensions_installments, { isNull }) =>
                  isNull(products_extensions_installments.deletedAt)
              }
            }
          },
          installments: {
            orderBy: (products_installments, { asc }) =>
              asc(products_installments.createdAt),
            where: (products_installments, { isNull }) =>
              isNull(products_installments.deletedAt)
          }
        }
      })

      return product ?? null
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all products'
      })
    }
  })
