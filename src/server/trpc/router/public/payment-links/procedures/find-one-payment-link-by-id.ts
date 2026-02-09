import { TRPCError } from '@trpc/server'
import z from 'zod'
import { publicProcedure } from '~/server/trpc/config'
import {
  ContractsTableValidators,
  ExtensionPaymentLinksTableValidators,
  MembershipsTableValidators,
  ProductPaymentLinksTableValidators,
  ProductsExtensionsInstallmentsTableValidators,
  ProductsExtensionsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

const input = z.object({ id: z.string() })

const contractSchema = ContractsTableValidators.select.pick({
  id: true,
  name: true,
  pathname: true
})

const productPaymentLinkOutput =
  ProductPaymentLinksTableValidators.select.extend({
    contract: contractSchema,
    product: ProductsTableValidators.select.extend({
      extensions: ProductsExtensionsTableValidators.select
        .extend({
          installments:
            ProductsExtensionsInstallmentsTableValidators.select.array()
        })
        .array(),
      installments: ProductsInstallmentsTableValidators.select.array()
    })
  })

const extensionPaymentLinkOutput =
  ExtensionPaymentLinksTableValidators.select.extend({
    contract: contractSchema,
    extension: ProductsExtensionsTableValidators.select.extend({
      installments: ProductsExtensionsInstallmentsTableValidators.select.array()
    }),
    membership: MembershipsTableValidators.select.pick({
      id: true,
      startDate: true,
      endDate: true,
      status: true
    })
  })

const output = z
  .union([productPaymentLinkOutput, extensionPaymentLinkOutput])
  .nullable()

export const findOnePaymentLinkByIdProcedure = publicProcedure
  .input(input)
  .output(output)
  .query(async ({ ctx, input }) => {
    try {
      // First try product payment links
      const productPaymentLink =
        await ctx.db.query.product_payment_links.findFirst({
          where: (product_payment_links, { and, eq, gte, isNull }) =>
            and(
              eq(product_payment_links.id, input.id),
              isNull(product_payment_links.deletedAt),
              gte(product_payment_links.expiresAt, new Date().toISOString())
            ),
          with: {
            contract: {
              columns: {
                id: true,
                name: true,
                pathname: true
              }
            },
            product: {
              with: {
                extensions: {
                  with: {
                    installments: true
                  }
                },
                installments: true
              }
            }
          }
        })

      if (productPaymentLink) {
        return productPaymentLink
      }

      // If not found, try extension payment links
      const extensionPaymentLink =
        await ctx.db.query.extension_payment_links.findFirst({
          where: (extension_payment_links, { and, eq, gte, isNull }) =>
            and(
              eq(extension_payment_links.id, input.id),
              isNull(extension_payment_links.deletedAt),
              gte(extension_payment_links.expiresAt, new Date().toISOString())
            ),
          with: {
            contract: {
              columns: {
                id: true,
                name: true,
                pathname: true
              }
            },
            extension: {
              with: {
                installments: true
              }
            },
            membership: {
              columns: {
                id: true,
                startDate: true,
                endDate: true,
                status: true
              }
            }
          }
        })

      return extensionPaymentLink ?? null
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find one payment link by id'
      })
    }
  })
