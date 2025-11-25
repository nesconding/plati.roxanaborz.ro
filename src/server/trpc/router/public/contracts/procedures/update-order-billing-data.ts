import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import z from 'zod'

import { product_orders } from '~/server/database/schema'
import { publicProcedure } from '~/server/trpc/config'

const addressSchema = z.object({
  apartment: z.string().optional(),
  building: z.string().optional(),
  city: z.string(),
  country: z.string(),
  county: z.string(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  number: z.string(),
  postalCode: z.string(),
  street: z.string()
})

const personBillingSchema = z.object({
  address: addressSchema,
  cnp: z.string(),
  email: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  surname: z.string(),
  type: z.literal('PERSON')
})

const companyBillingSchema = z.object({
  bank: z.string(),
  bankAccount: z.string(),
  cui: z.string(),
  name: z.string(),
  registrationNumber: z.string(),
  representativeLegal: z.string(),
  socialHeadquarters: addressSchema,
  type: z.literal('COMPANY')
})

const billingDataSchema = z.discriminatedUnion('type', [
  personBillingSchema,
  companyBillingSchema
])

const input = z.object({
  billingData: billingDataSchema,
  paymentLinkId: z.string()
})

export const updateOrderBillingDataProcedure = publicProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    try {
      // Find the order by payment link ID
      const order = await ctx.db.query.product_orders.findFirst({
        where: (product_orders, { eq }) =>
          eq(product_orders.productPaymentLinkId, input.paymentLinkId)
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found for this payment link'
        })
      }

      // Update the order with billing data
      await ctx.db
        .update(product_orders)
        .set({
          billingData: input.billingData
        })
        .where(eq(product_orders.id, order.id))

      return { success: true }
    } catch (cause) {
      if (cause instanceof TRPCError) {
        throw cause
      }
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update order billing data'
      })
    }
  })
