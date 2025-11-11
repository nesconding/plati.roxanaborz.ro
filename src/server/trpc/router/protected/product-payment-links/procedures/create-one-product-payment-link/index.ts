import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import z from 'zod'
import * as schema from '~/server/database/schema'
import { StripeService } from '~/server/services/stripe'
import { protectedProcedure } from '~/server/trpc/config'
import { createProductPaymentLinkInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data'
import { CreateProductPaymentLinkFormParser } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-parser'
import { CreateProductPaymentLinkFormSchema } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { ProductPaymentLinksTableValidators } from '~/shared/validation/tables'

export const createOneProductPaymentLinkProcedure = protectedProcedure
  .input(CreateProductPaymentLinkFormSchema)
  .output(
    z.object({
      data: ProductPaymentLinksTableValidators.select,
      url: z.string()
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const parsed = await CreateProductPaymentLinkFormParser.Parse(input)
      if (!parsed?.success || parsed?.error) {
        console.error(parsed?.error)
        throw new TRPCError({
          cause: parsed?.error,
          code: 'BAD_REQUEST',
          message: 'Invalid input'
        })
      }

      const createdId = createId()
      const data = await createProductPaymentLinkInsertData({
        data: parsed.data,
        db: ctx.db,
        user: ctx.session.user
      })

      const paymentIntent = await StripeService.createPaymentIntent({
        productPaymentLinkId: createdId,
        ...data
      })
      const insertData = {
        id: createdId,
        ...data,
        stripeClientSecret: paymentIntent.clientSecret,
        stripePaymentIntentId: paymentIntent.id
      } satisfies typeof ProductPaymentLinksTableValidators.$types.insert

      const [paymentLink] = await ctx.db
        .insert(schema.product_payment_links)
        .values(insertData)
        .returning()

      const url = new URL(process.env.VERCEL_URL!)
      url.pathname = `/checkout/${paymentLink.id}`

      return {
        data: paymentLink,
        url: url.toString()
      }
    } catch (cause) {
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create one payment link'
      })
    }
  })
