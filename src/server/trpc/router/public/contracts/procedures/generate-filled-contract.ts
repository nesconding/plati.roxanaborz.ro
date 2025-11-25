import { TRPCError } from '@trpc/server'
import z from 'zod'
import { PricingService } from '~/lib/pricing'

import {
  type ContractFieldsData,
  fetchContractPdf,
  fillContractPdf
} from '~/server/services/contract-pdf'
import { publicProcedure } from '~/server/trpc/config'

const addressSchema = z.object({
  apartment: z.string().optional(),
  building: z.string().optional(),
  city: z.string(),
  country: z.string(),
  county: z.string(),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  postalCode: z.string(),
  street: z.string(),
  streetNumber: z.string()
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

const output = z.object({
  contractName: z.string(),
  pdfBase64: z.string()
})

export const generateFilledContractProcedure = publicProcedure
  .input(input)
  .output(output)
  .mutation(async ({ ctx, input }) => {
    try {
      // Fetch the payment link with contract
      const paymentLink = await ctx.db.query.product_payment_links.findFirst({
        where: (product_payment_links, { eq }) =>
          eq(product_payment_links.id, input.paymentLinkId),
        with: {
          contract: true
        }
      })

      if (!paymentLink) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment link not found'
        })
      }

      if (!paymentLink.contract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found for this payment link'
        })
      }

      // Fetch the contract PDF
      const pdfBytes = await fetchContractPdf(paymentLink.contract.pathname)

      // Prepare the data for filling
      const contractData: ContractFieldsData = {
        ...input.billingData,
        paymentTotal: PricingService.formatPrice(
          paymentLink.totalAmountToPay,
          paymentLink.currency
        ),
        paymentType: paymentLink.type
      }

      // Fill the contract
      const filledPdfBytes = await fillContractPdf(pdfBytes, contractData)

      // Convert to base64
      const pdfBase64 = Buffer.from(filledPdfBytes).toString('base64')

      return {
        contractName: paymentLink.contract.name,
        pdfBase64
      }
    } catch (cause) {
      if (cause instanceof TRPCError) {
        throw cause
      }
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate filled contract'
      })
    }
  })
