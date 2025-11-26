import { TRPCError } from '@trpc/server'
import z from 'zod'
import { publicProcedure } from '~/server/trpc/config'
import {
  ContractsTableValidators,
  ProductPaymentLinksTableValidators,
  ProductsExtensionsInstallmentsTableValidators,
  ProductsExtensionsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators
} from '~/shared/validation/tables'

const input = z.object({ id: z.string() })
const output = ProductPaymentLinksTableValidators.select
  .extend({
    contract: ContractsTableValidators.select.pick({
      id: true,
      name: true,
      pathname: true
    }),
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
  .nullable()

export const findOnePaymentLinkByIdProcedure = publicProcedure
  .input(input)
  .output(output)
  .query(async ({ ctx, input }) => {
    try {
      const paymentLink = await ctx.db.query.product_payment_links.findFirst({
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
      return paymentLink ?? null
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to find one payment link by id'
      })
    }
  })
