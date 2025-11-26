import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import * as schema from '~/server/database/schema'
import { StripeService } from '~/server/services/stripe'
import { protectedProcedure } from '~/server/trpc/config'
import { createProductPaymentLinkInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data'
import { CreateProductPaymentLinkFormParser } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-parser'
import { CreateProductPaymentLinkFormSchema } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { ProductPaymentLinksTableValidators } from '~/shared/validation/tables'

export const createOneProductPaymentLinkProcedure = protectedProcedure
  .input(CreateProductPaymentLinkFormSchema)
  .output(ProductPaymentLinksTableValidators.select)
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

      // For TBI payments, don't create a Stripe PaymentIntent
      // The TBI loan application will be initiated at checkout time
      if (data.paymentMethodType === PaymentMethodType.TBI) {
        const insertData = {
          id: createdId,
          ...data,
          stripeClientSecret: null,
          stripePaymentIntentId: null
        } satisfies typeof ProductPaymentLinksTableValidators.$types.insert

        const [paymentLink] = await ctx.db
          .insert(schema.product_payment_links)
          .values(insertData)
          .returning()

        return paymentLink
      }

      // For Card and BankTransfer payments, create a Stripe PaymentIntent
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

      return paymentLink
    } catch (cause) {
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create one payment link'
      })
    }
  })
