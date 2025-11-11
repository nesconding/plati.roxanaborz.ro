import { TRPCError } from '@trpc/server'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import {
  products,
  products_extensions,
  products_extensions_installments,
  products_installments
} from '~/server/database/schema'
import { adminProcedure } from '~/server/trpc/config'
import {
  ProductsExtensionsInstallmentsTableValidators,
  ProductsExtensionsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

const input = z.object({ id: z.string() })

const output = ProductsTableValidators.select.extend({
  extensions: z.array(
    ProductsExtensionsTableValidators.select.extend({
      installments: z.array(
        ProductsExtensionsInstallmentsTableValidators.select
      )
    })
  ),
  installments: z.array(ProductsInstallmentsTableValidators.select)
})

export const deleteOneProductByIdProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      const deletedAt = new Date().toISOString()
      const [product] = await ctx.db
        .update(products)
        .set({ deletedAt })
        .where(eq(products.id, input.id))
        .returning()

      const installments = await ctx.db
        .update(products_installments)
        .set({ deletedAt })
        .where(eq(products_installments.productId, input.id))
        .returning()

      const extensions = await ctx.db
        .update(products_extensions)
        .set({ deletedAt })
        .where(eq(products_extensions.productId, input.id))
        .returning()

      const extensionsInstallments = await ctx.db
        .update(products_extensions_installments)
        .set({ deletedAt })
        .where(
          inArray(
            products_extensions_installments.extensionId,
            extensions.map((extension) => extension.id)
          )
        )
        .returning()

      const result = {
        ...product,
        extensions: extensions.map((extension) => ({
          ...extension,
          installments: extensionsInstallments.filter(
            (installment) => installment.extensionId === extension.id
          )
        })),
        installments
      }

      return result
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete one product by id'
      })
    }
  })
