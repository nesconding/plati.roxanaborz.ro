import { TRPCError } from '@trpc/server'
import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/database/schema'
import { publicProcedure } from '~/server/trpc/config'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

const addressSchema = z.object({
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
})

const personBillingSchema = z.object({
  address: addressSchema,
  cnp: z.string().min(13).max(13),
  email: z.string().email(),
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  surname: z.string().min(1),
  type: z.literal('PERSON')
})

const companyBillingSchema = z.object({
  bank: z.string().min(1),
  bankAccount: z.string().min(1),
  cui: z.string().min(1),
  name: z.string().min(1),
  registrationNumber: z.string().min(1),
  representativeLegal: z.string().min(1),
  socialHeadquarters: addressSchema,
  type: z.literal('COMPANY')
})

const billingDataSchema = z.discriminatedUnion('type', [
  personBillingSchema,
  companyBillingSchema
])

const initiateBankTransferPaymentInputSchema = z.object({
  billingData: billingDataSchema,
  paymentLinkId: z.string()
})

export const initiateBankTransferPaymentProcedure = publicProcedure
  .input(initiateBankTransferPaymentInputSchema)
  .output(z.object({ orderId: z.string(), success: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    try {
      // Helper to validate payment link
      const validatePaymentLink = (paymentLink: {
        paymentMethodType: string
        status: string
      }) => {
        if (paymentLink.paymentMethodType !== PaymentMethodType.BankTransfer) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payment link is not configured for bank transfer payments'
          })
        }

        if (
          paymentLink.status === PaymentStatusType.Succeeded ||
          paymentLink.status === PaymentStatusType.Canceled
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Payment link has already been processed'
          })
        }
      }

      // Helper to get customer info from billing data
      const getCustomerInfo = (
        billingData: typeof input.billingData,
        fallbackEmail: string
      ) => ({
        customerEmail:
          billingData.type === 'PERSON' ? billingData.email : fallbackEmail,
        customerName:
          billingData.type === 'PERSON'
            ? `${billingData.surname} ${billingData.name}`
            : billingData.name
      })

      // 1. Try product payment link first
      const productPaymentLink =
        await ctx.db.query.product_payment_links.findFirst({
          where: (product_payment_links, { eq }) =>
            eq(product_payment_links.id, input.paymentLinkId),
          with: {
            product: true
          }
        })

      if (productPaymentLink) {
        validatePaymentLink(productPaymentLink)

        const orderId = createId()
        const { customerEmail, customerName } = getCustomerInfo(
          input.billingData,
          productPaymentLink.customerEmail
        )

        // Create product order
        await ctx.db.insert(schema.product_orders).values({
          billingData: input.billingData,
          customerEmail,
          customerName,
          id: orderId,
          paymentProductType: productPaymentLink.paymentProductType,
          productName: productPaymentLink.productName,
          productPaymentLinkId: productPaymentLink.id,
          status: OrderStatusType.PendingBankTransferPayment,
          stripePaymentIntentId: '',
          type: OrderType.OneTimePaymentOrder
        })

        // Update product payment link status
        await ctx.db
          .update(schema.product_payment_links)
          .set({
            billingData: input.billingData,
            status: PaymentStatusType.Processing
          })
          .where(eq(schema.product_payment_links.id, productPaymentLink.id))

        return { orderId, success: true }
      }

      // 2. Try extension payment link
      const extensionPaymentLink =
        await ctx.db.query.extension_payment_links.findFirst({
          where: (extension_payment_links, { eq }) =>
            eq(extension_payment_links.id, input.paymentLinkId),
          with: {
            extension: true
          }
        })

      if (extensionPaymentLink) {
        validatePaymentLink(extensionPaymentLink)

        const orderId = createId()
        const { customerEmail, customerName } = getCustomerInfo(
          input.billingData,
          extensionPaymentLink.customerEmail
        )

        // Create extension order
        await ctx.db.insert(schema.extension_orders).values({
          billingData: input.billingData,
          customerEmail,
          customerName,
          extensionPaymentLinkId: extensionPaymentLink.id,
          id: orderId,
          membershipId: extensionPaymentLink.membershipId,
          paymentProductType: extensionPaymentLink.paymentProductType,
          productName: extensionPaymentLink.productName,
          status: OrderStatusType.PendingBankTransferPayment,
          stripePaymentIntentId: '',
          type: OrderType.OneTimePaymentOrder
        })

        // Update extension payment link status
        await ctx.db
          .update(schema.extension_payment_links)
          .set({
            billingData: input.billingData,
            status: PaymentStatusType.Processing
          })
          .where(
            eq(schema.extension_payment_links.id, extensionPaymentLink.id)
          )

        return { orderId, success: true }
      }

      // 3. Neither found
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment link not found'
      })
    } catch (cause) {
      console.error(
        '[BankTransfer] Failed to initiate bank transfer payment:',
        cause
      )

      if (cause instanceof TRPCError) {
        throw cause
      }

      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initiate bank transfer payment'
      })
    }
  })
