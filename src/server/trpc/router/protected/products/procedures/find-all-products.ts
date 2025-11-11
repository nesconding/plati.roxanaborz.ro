import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure } from '~/server/trpc/config'
import {
  ProductsExtensionsInstallmentsTableValidators,
  ProductsExtensionsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

const output = z.array(
  ProductsTableValidators.select.extend({
    extensions: z.array(
      ProductsExtensionsTableValidators.select.extend({
        installments: z.array(
          ProductsExtensionsInstallmentsTableValidators.select
        )
      })
    ),
    installments: z.array(ProductsInstallmentsTableValidators.select)
  })
)

export const findAllProductsProcedure = protectedProcedure
  .output(output)
  .query(({ ctx }) => {
    try {
      return ctx.db.query.products.findMany({
        orderBy: (products, { asc }) => asc(products.createdAt),
        where: (products, { isNull }) => isNull(products.deletedAt),
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
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find all products'
      })
    }
  })
