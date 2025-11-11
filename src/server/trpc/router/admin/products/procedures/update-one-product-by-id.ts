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
import { NumericString } from '~/shared/validation/utils'

const transformedNumericString = NumericString()
  .transform(Number)
  .pipe(z.number().positive())

const input = z.object({
  extensions: z.array(
    z.object({
      extensionMonths: transformedNumericString,
      id: z.string().nonempty().optional(),
      installments: z.array(
        z.object({
          count: transformedNumericString,
          id: z.string().nonempty().optional(),
          pricePerInstallment: NumericString()
        })
      ),
      minDepositAmount: NumericString(),
      price: NumericString()
    })
  ),
  id: z.string().nonempty(),
  installments: z.array(
    z.object({
      count: transformedNumericString,
      id: z.string().nonempty().optional(),
      pricePerInstallment: NumericString()
    })
  ),
  membershipDurationMonths: transformedNumericString,
  minDepositAmount: NumericString(),
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

export const updateOneProductByIdProcedure = adminProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      const deletedAt = new Date().toISOString()

      // 1. Get current product state
      const product = await ctx.db.query.products.findFirst({
        where: (products, { and, isNull, eq }) =>
          and(isNull(products.deletedAt), eq(products.id, input.id)),
        with: {
          extensions: {
            orderBy: (products_extensions, { asc }) =>
              asc(products_extensions.createdAt),
            where: (products_extensions, { isNull }) =>
              isNull(products_extensions.deletedAt),
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

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found'
        })
      }

      await ctx.db.transaction(async (tx) => {
        // 2. Update main product
        await tx
          .update(products)
          .set({
            membershipDurationMonths: input.membershipDurationMonths,
            minDepositAmount: input.minDepositAmount,
            name: input.name,
            price: input.price
          })
          .where(eq(products.id, input.id))

        // 3. Handle product installments
        const inputInstallmentIds = new Set(
          input.installments.filter((i) => i.id).map((i) => i.id!)
        )
        const currentInstallmentIds = new Set(
          product.installments.map((i) => i.id)
        )

        // Soft delete removed installments
        const installmentsToDelete = product.installments
          .filter((i) => !inputInstallmentIds.has(i.id))
          .map((i) => i.id)

        if (installmentsToDelete.length > 0) {
          await tx
            .update(products_installments)
            .set({ deletedAt })
            .where(inArray(products_installments.id, installmentsToDelete))
        }

        // Update existing or insert new installments
        for (const installment of input.installments) {
          if (installment.id && currentInstallmentIds.has(installment.id)) {
            // Update existing
            await tx
              .update(products_installments)
              .set({
                count: installment.count,
                pricePerInstallment: installment.pricePerInstallment
              })
              .where(eq(products_installments.id, installment.id))
          } else {
            // Insert new
            await tx.insert(products_installments).values({
              count: installment.count,
              pricePerInstallment: installment.pricePerInstallment,
              productId: input.id
            })
          }
        }

        // 4. Handle product extensions
        const inputExtensionIds = new Set(
          input.extensions.filter((e) => e.id).map((e) => e.id!)
        )

        // Soft delete removed extensions
        const extensionsToDelete = product.extensions
          .filter((e) => !inputExtensionIds.has(e.id))
          .map((e) => e.id)

        if (extensionsToDelete.length > 0) {
          await tx
            .update(products_extensions)
            .set({ deletedAt })
            .where(inArray(products_extensions.id, extensionsToDelete))
        }

        // Update existing or insert new extensions
        for (const extension of input.extensions) {
          let extensionId: string
          const currentExtension = product.extensions.find(
            (e) => e.id === extension.id
          )

          if (extension.id && currentExtension) {
            // Update existing extension
            await tx
              .update(products_extensions)
              .set({
                extensionMonths: extension.extensionMonths,
                minDepositAmount: extension.minDepositAmount,
                price: extension.price
              })
              .where(eq(products_extensions.id, extension.id))
            extensionId = extension.id
          } else {
            // Insert new extension
            const [inserted] = await tx
              .insert(products_extensions)
              .values({
                extensionMonths: extension.extensionMonths,
                // TODO: in the future we will allow to disable deposit amount and a switch to the update form
                isDepositAmountEnabled: extension.minDepositAmount !== '',
                minDepositAmount: extension.minDepositAmount,
                price: extension.price,
                productId: input.id
              })
              .returning({ id: products_extensions.id })
            extensionId = inserted!.id
          }

          // 5. Handle extension installments
          const inputExtensionInstallmentIds = new Set(
            extension.installments.filter((i) => i.id).map((i) => i.id!)
          )
          const currentExtensionInstallmentIds = new Set(
            currentExtension?.installments.map((i) => i.id) || []
          )

          // Soft delete removed extension installments
          const extensionInstallmentsToDelete = (
            currentExtension?.installments || []
          )
            .filter((i) => !inputExtensionInstallmentIds.has(i.id))
            .map((i) => i.id)

          if (extensionInstallmentsToDelete.length > 0) {
            await tx
              .update(products_extensions_installments)
              .set({ deletedAt })
              .where(
                inArray(
                  products_extensions_installments.id,
                  extensionInstallmentsToDelete
                )
              )
          }

          // Update existing or insert new extension installments
          for (const installment of extension.installments) {
            if (
              installment.id &&
              currentExtensionInstallmentIds.has(installment.id)
            ) {
              // Update existing
              await tx
                .update(products_extensions_installments)
                .set({
                  count: installment.count,
                  pricePerInstallment: installment.pricePerInstallment
                })
                .where(eq(products_extensions_installments.id, installment.id))
            } else {
              // Insert new
              await tx.insert(products_extensions_installments).values({
                count: installment.count,
                extensionId: extensionId,
                pricePerInstallment: installment.pricePerInstallment
              })
            }
          }
        }
      })

      // 6. Fetch and return updated product
      const result = await ctx.db.query.products.findFirst({
        where: (products, { and, isNull, eq }) =>
          and(isNull(products.deletedAt), eq(products.id, input.id)),
        with: {
          extensions: {
            orderBy: (products_extensions, { asc }) =>
              asc(products_extensions.createdAt),
            where: (products_extensions, { isNull }) =>
              isNull(products_extensions.deletedAt),
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

      return result!
    } catch (cause) {
      if (cause instanceof TRPCError) throw cause
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update one product by id'
      })
    }
  })
