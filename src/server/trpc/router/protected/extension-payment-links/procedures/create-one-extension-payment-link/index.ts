import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import z from 'zod'
import * as schema from '~/server/database/schema'
import { StripeService } from '~/server/services/stripe'
import { protectedProcedure } from '~/server/trpc/config'
import { createExtensionPaymentLinkInsertData } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data'
import { CreateExtensionPaymentLinkFormParser } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-parser'
import { CreateExtensionPaymentLinkFormSchema } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { ExtensionPaymentLinksTableValidators } from '~/shared/validation/tables'

export const createOneExtensionPaymentLinkProcedure = protectedProcedure
  .input(CreateExtensionPaymentLinkFormSchema)
  .output(ExtensionPaymentLinksTableValidators.select)
  .mutation(async ({ ctx, input }) => {
    try {
      const parsed = await CreateExtensionPaymentLinkFormParser.Parse(input)
      if (!parsed?.success || parsed?.error) {
        console.error(parsed?.error)
        throw new TRPCError({
          cause: parsed?.error,
          code: 'BAD_REQUEST',
          message: 'Invalid input'
        })
      }

      const createdId = createId()
      const data = await createExtensionPaymentLinkInsertData({
        data: parsed.data,
        db: ctx.db,
        user: ctx.session.user
      })

      const paymentIntent = await StripeService.createPaymentIntent({
        extensionPaymentLinkId: createdId,
        ...data
      })
      const insertData = {
        id: createdId,
        ...data,
        stripeClientSecret: paymentIntent.clientSecret,
        stripePaymentIntentId: paymentIntent.id
      } satisfies typeof ExtensionPaymentLinksTableValidators.$types.insert

      const [paymentLink] = await ctx.db
        .insert(schema.extension_payment_links)
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
