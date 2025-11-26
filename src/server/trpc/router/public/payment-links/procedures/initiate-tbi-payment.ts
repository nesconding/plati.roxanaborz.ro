import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/database/schema'
import { TbiService } from '~/server/services/tbi'
import { publicProcedure } from '~/server/trpc/config'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

// TBI requires person billing data (not company)
const tbiPersonBillingSchema = z.object({
  address: z.object({
    apartment: z.string().optional(),
    building: z.string().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    county: z.string().min(1),
    entrance: z.string().optional(),
    floor: z.string().optional(),
    postalCode: z.string().min(1),
    street: z.string().min(1),
    streetNumber: z.string().min(1)
  }),
  cnp: z.string().min(13).max(13),
  email: z.string().email(),
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  surname: z.string().min(1),
  type: z.literal('PERSON')
})

const initiateTbiPaymentInputSchema = z.object({
  billingData: tbiPersonBillingSchema,
  paymentLinkId: z.string()
})

export const initiateTbiPaymentProcedure = publicProcedure
  .input(initiateTbiPaymentInputSchema)
  .output(z.object({ redirectUrl: z.string() }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Find the payment link
      const paymentLink = await ctx.db.query.product_payment_links.findFirst({
        where: (product_payment_links, { eq }) =>
          eq(product_payment_links.id, input.paymentLinkId),
        with: {
          product: true
        }
      })

      if (!paymentLink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment link not found'
        })
      }

      // Verify this is a TBI payment link
      if (paymentLink.paymentMethodType !== PaymentMethodType.TBI) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment link is not configured for TBI payments'
        })
      }

      // Verify the payment link is not already processed
      if (
        paymentLink.status === PaymentStatusType.Succeeded ||
        paymentLink.status === PaymentStatusType.Canceled
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment link has already been processed'
        })
      }

      // Build the full address string
      const address = input.billingData.address
      const fullAddress = [
        address.street,
        address.streetNumber,
        address.building ? `Bl. ${address.building}` : '',
        address.entrance ? `Sc. ${address.entrance}` : '',
        address.floor ? `Et. ${address.floor}` : '',
        address.apartment ? `Ap. ${address.apartment}` : ''
      ]
        .filter(Boolean)
        .join(' ')

      // Build the webhook URL for TBI to call back
      const baseUrl = process.env.BASE_URL
      const backRefUrl = `${baseUrl}/api/webhooks/tbi`

      // Create TBI loan application
      const { redirectUrl } = await TbiService.createLoanApplication(
        {
          billingAddress: fullAddress,
          billingCity: address.city,
          billingCounty: address.county,
          customerCnp: input.billingData.cnp,
          customerEmail: input.billingData.email,
          customerFirstName: input.billingData.name,
          customerLastName: input.billingData.surname,
          customerPhone: input.billingData.phoneNumber,
          orderId: paymentLink.id,
          orderTotal: parseFloat(paymentLink.totalAmountToPay),
          productName: paymentLink.productName,
          productSku: paymentLink.product.id,
          shippingAddress: fullAddress,
          shippingCity: address.city,
          shippingCounty: address.county
        },
        backRefUrl
      )

      // Update the payment link with the TBI order ID and set status to processing
      await ctx.db
        .update(schema.product_payment_links)
        .set({
          billingData: input.billingData,
          status: PaymentStatusType.Processing,
          tbiOrderId: paymentLink.id // Using payment link ID as TBI order ID
        })
        .where(eq(schema.product_payment_links.id, paymentLink.id))

      return { redirectUrl }
    } catch (cause) {
      console.error('[TBI] Failed to initiate TBI payment:', cause)

      if (cause instanceof TRPCError) {
        throw cause
      }

      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initiate TBI payment'
      })
    }
  })
