import { TRPCError } from '@trpc/server'
import z from 'zod'
import { PricingService } from '~/lib/pricing'

import {
  type ContractFieldsData,
  fetchContractPdf,
  fillContractPdf
} from '~/server/services/contract-pdf'
import { DatesService } from '~/server/services/dates'
import { publicProcedure } from '~/server/trpc/config'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'

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

const paymentLinkNameMap = {
  [PaymentLinkType.Integral]: 'Integral',
  [PaymentLinkType.Deposit]: 'Avans + Diferența',
  [PaymentLinkType.Installments]: 'Rate',
  [PaymentLinkType.InstallmentsDeposit]: 'Avans + Rate'
}

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
          contract: true,
          product: true
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

      // Build payment schedule based on payment link type
      const { currency } = paymentLink
      const payments: Array<{ amount: string; deadline: string }> = []

      switch (paymentLink.type) {
        case PaymentLinkType.Integral: {
          payments.push({
            amount: PricingService.formatPrice(
              paymentLink.totalAmountToPay,
              currency
            ),
            deadline: DatesService.formatDateForContract(
              new Date(paymentLink.expiresAt)
            )
          })
          break
        }
        case PaymentLinkType.Deposit: {
          payments.push({
            amount: PricingService.formatPrice(
              paymentLink.depositAmount ?? '0',
              currency
            ),
            deadline: DatesService.formatDateForContract(
              new Date(paymentLink.expiresAt)
            )
          })
          if (
            paymentLink.remainingAmountToPay &&
            paymentLink.firstPaymentDateAfterDeposit
          ) {
            payments.push({
              amount: PricingService.formatPrice(
                paymentLink.remainingAmountToPay,
                currency
              ),
              deadline: DatesService.formatDateForContract(
                new Date(paymentLink.firstPaymentDateAfterDeposit)
              )
            })
          }
          break
        }
        case PaymentLinkType.Installments: {
          const installmentsCount = paymentLink.productInstallmentsCount ?? 1
          const installmentAmount =
            paymentLink.productInstallmentAmountToPay ?? '0'
          for (let i = 0; i < installmentsCount; i++) {
            const date =
              i === 0
                ? new Date(paymentLink.expiresAt)
                : DatesService.addMonths(
                    new Date(paymentLink.createdAt),
                    i
                  )
            payments.push({
              amount: PricingService.formatPrice(installmentAmount, currency),
              deadline: DatesService.formatDateForContract(date)
            })
          }
          break
        }
        case PaymentLinkType.InstallmentsDeposit: {
          payments.push({
            amount: PricingService.formatPrice(
              paymentLink.depositAmount ?? '0',
              currency
            ),
            deadline: DatesService.formatDateForContract(
              new Date(paymentLink.expiresAt)
            )
          })
          const count = paymentLink.productInstallmentsCount ?? 1
          const remainingInstallment =
            paymentLink.remainingInstallmentAmountToPay ?? '0'
          const firstDate = paymentLink.firstPaymentDateAfterDeposit
          if (firstDate) {
            for (let i = 0; i < count; i++) {
              payments.push({
                amount: PricingService.formatPrice(
                  remainingInstallment,
                  currency
                ),
                deadline: DatesService.formatDateForContract(
                  DatesService.addMonths(new Date(firstDate), i)
                )
              })
            }
          }
          break
        }
      }

      const lastPaymentDeadline =
        payments.length > 0 ? payments[payments.length - 1].deadline : ''

      const programDuration = paymentLink.product
        ? `${paymentLink.product.membershipDurationMonths} luni`
        : ''

      // Prepare the data for filling
      const contractData: ContractFieldsData = {
        ...input.billingData,
        paymentDeadline: lastPaymentDeadline,
        payments,
        paymentTotal: PricingService.formatPrice(
          paymentLink.totalAmountToPay,
          currency
        ),
        paymentType: paymentLinkNameMap[paymentLink.type],
        programDuration,
        programName: paymentLink.productName
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
