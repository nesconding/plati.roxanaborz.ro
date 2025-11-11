import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
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
import { NumericString } from '~/shared/validation/utils'

const transformedNumericString = NumericString()
  .transform(Number)
  .pipe(z.number().positive())

const input = z.object({
  extensions: z.array(
    z.object({
      extensionMonths: transformedNumericString,
      installments: z.array(
        z.object({
          count: transformedNumericString,
          pricePerInstallment: NumericString()
        })
      ),
      isDepositAmountEnabled: z.boolean(),
      minDepositAmount: z.union([z.literal(''), NumericString()]),
      price: NumericString()
    })
  ),
  installments: z.array(
    z.object({
      count: transformedNumericString,
      pricePerInstallment: NumericString()
    })
  ),
  isDepositAmountEnabled: z.boolean(),
  membershipDurationMonths: transformedNumericString,
  minDepositAmount: z.union([z.literal(''), NumericString()]),
  name: z.string().nonempty(),
  price: NumericString()
})

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

export const createOneProductProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    console.log('input', input)

    try {
      const [product] = await ctx.db
        .insert(products)
        .values({
          ...input,
          isDepositAmountEnabled: input.isDepositAmountEnabled,
          minDepositAmount: input.minDepositAmount || '0'
        })
        .returning()

      const installments =
        input.installments.length > 0
          ? await ctx.db
              .insert(products_installments)
              .values(
                input.installments.map((installment) => ({
                  ...installment,
                  productId: product.id
                }))
              )
              .returning()
          : []

      const extensionsData = input.extensions.map((extension) => {
        const extensionId = createId()
        return {
          ...extension,
          id: extensionId,
          installments: extension.installments.map((installment) => ({
            ...installment,
            extensionId
          })),
          productId: product.id
        }
      })

      const extensions =
        input.extensions.length > 0
          ? await ctx.db
              .insert(products_extensions)
              .values(
                extensionsData.map((extension) => ({
                  ...extension,
                  isDepositAmountEnabled: extension.isDepositAmountEnabled,
                  minDepositAmount: extension.minDepositAmount ?? '0'
                }))
              )
              .returning()
          : []
      const allExtensionInstallments = extensionsData.flatMap(
        (extension) => extension.installments
      )

      const extensionsInstallments =
        allExtensionInstallments.length > 0
          ? await ctx.db
              .insert(products_extensions_installments)
              .values(allExtensionInstallments)
              .returning()
          : []

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
      const error = new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create one product'
      })
      console.error(error)
      throw error
    }
  })
