import { z } from 'zod'
import type { CreateProductPaymentLinkFormValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import type {
  CreateProductPaymentLinkDepositFormData,
  CreateProductPaymentLinkInstallmentsDepositFormData,
  CreateProductPaymentLinkInstallmentsFormData,
  CreateProductPaymentLinkIntegralFormData
} from '~/shared/create-product-payment-link-form/data'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { NumericLiteral } from '~/shared/validation/utils'
import { CreateProductPaymentLinkFormSection } from './enums/create-product-payment-link-form-sections'

// Participants
const participantsSchema = z.object({
  callerName: z.string(),
  scheduledEventUri: z.string().nonempty(),
  setterName: z.string()
})

// Product
const productSchema = z.object({
  contractId: z.cuid2(),
  productId: z.cuid2()
})

// Payment info
const paymentInfo = z.object({
  paymentMethodType: z.enum(PaymentMethodType),
  paymentSettingId: z.cuid2()
})

// Installments
const doesNotHaveInstallments = z.object({
  hasInstallments: z.literal(false),
  productInstallmentId: z.literal('')
})

const hasInstallments = z.object({
  hasInstallments: z.literal(true),
  productInstallmentId: z.cuid2()
})

// Deposit
const doesNotHaveDeposit = z.object({
  depositAmount: z.literal('').optional(),
  firstPaymentDateAfterDepositOptionId: z.literal('').optional(),
  hasDeposit: z.literal(false)
})

const hasDeposit = z.object({
  depositAmount: NumericLiteral(),
  firstPaymentDateAfterDepositOptionId: z.cuid2(),
  hasDeposit: z.literal(true)
})

export namespace CreateProductPaymentLinkFormParser {
  export namespace Validation {
    const base = z.object({
      [CreateProductPaymentLinkFormSection.Participants]: participantsSchema,
      [CreateProductPaymentLinkFormSection.PaymentInfo]: paymentInfo,
      [CreateProductPaymentLinkFormSection.Product]: productSchema
    })

    export const Integral = base.extend({
      [CreateProductPaymentLinkFormSection.Deposit]: doesNotHaveDeposit,
      [CreateProductPaymentLinkFormSection.Installments]:
        doesNotHaveInstallments
    })
    export type Integral = z.infer<
      typeof CreateProductPaymentLinkFormParser.Validation.Integral
    >

    export const Deposit = base.extend({
      [CreateProductPaymentLinkFormSection.Deposit]: hasDeposit,
      [CreateProductPaymentLinkFormSection.Installments]:
        doesNotHaveInstallments
    })
    export type Deposit = z.infer<
      typeof CreateProductPaymentLinkFormParser.Validation.Deposit
    >

    export const Installments = base.extend({
      [CreateProductPaymentLinkFormSection.Deposit]: doesNotHaveDeposit,
      [CreateProductPaymentLinkFormSection.Installments]: hasInstallments
    })
    export type Installments = z.infer<
      typeof CreateProductPaymentLinkFormParser.Validation.Installments
    >

    export const InstallmentsDeposit = base.extend({
      [CreateProductPaymentLinkFormSection.Deposit]: hasDeposit,
      [CreateProductPaymentLinkFormSection.Installments]: hasInstallments
    })
    export type InstallmentsDeposit = z.infer<
      typeof CreateProductPaymentLinkFormParser.Validation.InstallmentsDeposit
    >

    // Create One Payment Link Schema
    export const Schema = z.union([
      CreateProductPaymentLinkFormParser.Validation.Integral,
      CreateProductPaymentLinkFormParser.Validation.Deposit,
      CreateProductPaymentLinkFormParser.Validation.Installments,
      CreateProductPaymentLinkFormParser.Validation.InstallmentsDeposit
    ])
    export type Schema = z.infer<typeof Schema>
  }

  export namespace TypeGuards {
    function checkHasInstallments({
      hasInstallments,
      productInstallmentId
    }: {
      hasInstallments: boolean
      productInstallmentId: string
    }) {
      return hasInstallments === true && productInstallmentId !== ''
    }

    function checkDoesNotHaveInstallments({
      hasInstallments,
      productInstallmentId
    }: {
      hasInstallments: boolean
      productInstallmentId: string
    }) {
      return hasInstallments === false && productInstallmentId === ''
    }

    function checkHasDeposit({
      depositAmount,
      firstPaymentDateAfterDepositOptionId,
      hasDeposit
    }: {
      depositAmount?: string | undefined
      firstPaymentDateAfterDepositOptionId?: string | undefined
      hasDeposit: boolean
    }) {
      return (
        depositAmount !== undefined &&
        !Number.isNaN(parseInt(depositAmount, 10)) &&
        firstPaymentDateAfterDepositOptionId !== undefined &&
        firstPaymentDateAfterDepositOptionId !== '' &&
        hasDeposit === true
      )
    }

    function checkDoesNotHaveDeposit({
      depositAmount,
      firstPaymentDateAfterDepositOptionId,
      hasDeposit
    }: {
      depositAmount?: string | undefined
      firstPaymentDateAfterDepositOptionId?: string | undefined
      hasDeposit: boolean
    }) {
      return (
        (depositAmount === undefined || depositAmount === '') &&
        (firstPaymentDateAfterDepositOptionId === undefined ||
          firstPaymentDateAfterDepositOptionId === '') &&
        hasDeposit === false
      )
    }

    export function isIntegral(
      input: CreateProductPaymentLinkFormParser.Validation.Schema
    ): input is CreateProductPaymentLinkFormParser.Validation.Integral {
      return (
        checkDoesNotHaveInstallments(input.installments) &&
        checkDoesNotHaveDeposit(input.deposit)
      )
    }

    export function hasDeposit(
      input: CreateProductPaymentLinkFormParser.Validation.Schema
    ): input is CreateProductPaymentLinkFormParser.Validation.Deposit {
      return (
        checkDoesNotHaveInstallments(input.installments) &&
        checkHasDeposit(input.deposit)
      )
    }

    export function isInstallments(
      input: CreateProductPaymentLinkFormParser.Validation.Schema
    ): input is CreateProductPaymentLinkFormParser.Validation.Installments {
      return (
        checkHasInstallments(input.installments) &&
        checkDoesNotHaveDeposit(input.deposit)
      )
    }

    export function isInstallmentsDeposit(
      input: CreateProductPaymentLinkFormParser.Validation.Schema
    ): input is CreateProductPaymentLinkFormParser.Validation.InstallmentsDeposit {
      return (
        checkHasInstallments(input.installments) &&
        checkHasDeposit(input.deposit)
      )
    }
  }

  export async function Parse(values: CreateProductPaymentLinkFormValues) {
    const result =
      await CreateProductPaymentLinkFormParser.Validation.Schema.safeParseAsync(
        values
      )

    if (!result.success || result.error) {
      return {
        data: result.data,
        error: result.error,
        success: false
      } as const
    }

    switch (true) {
      // Product
      case CreateProductPaymentLinkFormParser.TypeGuards.isIntegral(
        result.data
      ): {
        const data = {
          callerName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .callerName,
          contractId:
            result.data[CreateProductPaymentLinkFormSection.Product].contractId,
          paymentMethodType:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          productId:
            result.data[CreateProductPaymentLinkFormSection.Product].productId,
          scheduledEventUri:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .scheduledEventUri,
          setterName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Integral
        } satisfies CreateProductPaymentLinkIntegralFormData

        return { data, success: true }
      }

      case CreateProductPaymentLinkFormParser.TypeGuards.hasDeposit(
        result.data
      ): {
        const data = {
          callerName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .callerName,
          contractId:
            result.data[CreateProductPaymentLinkFormSection.Product].contractId,
          depositAmount:
            result.data[CreateProductPaymentLinkFormSection.Deposit]
              .depositAmount,
          firstPaymentDateAfterDepositOptionId:
            result.data[CreateProductPaymentLinkFormSection.Deposit]
              .firstPaymentDateAfterDepositOptionId,
          hasDeposit:
            result.data[CreateProductPaymentLinkFormSection.Deposit].hasDeposit,
          paymentMethodType:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          productId:
            result.data[CreateProductPaymentLinkFormSection.Product].productId,
          scheduledEventUri:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .scheduledEventUri,
          setterName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Deposit
        } satisfies CreateProductPaymentLinkDepositFormData

        return { data, success: true }
      }

      case CreateProductPaymentLinkFormParser.TypeGuards.isInstallments(
        result.data
      ): {
        const data = {
          callerName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .callerName,
          contractId:
            result.data[CreateProductPaymentLinkFormSection.Product].contractId,
          hasInstallments:
            result.data[CreateProductPaymentLinkFormSection.Installments]
              .hasInstallments,
          paymentMethodType:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          productId:
            result.data[CreateProductPaymentLinkFormSection.Product].productId,
          productInstallmentId:
            result.data[CreateProductPaymentLinkFormSection.Installments]
              .productInstallmentId,
          scheduledEventUri:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .scheduledEventUri,
          setterName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Installments
        } satisfies CreateProductPaymentLinkInstallmentsFormData

        return { data, success: true }
      }

      case CreateProductPaymentLinkFormParser.TypeGuards.isInstallmentsDeposit(
        result.data
      ): {
        const data = {
          callerName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .callerName,
          contractId:
            result.data[CreateProductPaymentLinkFormSection.Product].contractId,
          depositAmount:
            result.data[CreateProductPaymentLinkFormSection.Deposit]
              .depositAmount,
          firstPaymentDateAfterDepositOptionId:
            result.data[CreateProductPaymentLinkFormSection.Deposit]
              .firstPaymentDateAfterDepositOptionId,
          hasDeposit:
            result.data[CreateProductPaymentLinkFormSection.Deposit].hasDeposit,
          hasInstallments:
            result.data[CreateProductPaymentLinkFormSection.Installments]
              .hasInstallments,
          paymentMethodType:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateProductPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          productId:
            result.data[CreateProductPaymentLinkFormSection.Product].productId,
          productInstallmentId:
            result.data[CreateProductPaymentLinkFormSection.Installments]
              .productInstallmentId,
          scheduledEventUri:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .scheduledEventUri,
          setterName:
            result.data[CreateProductPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.InstallmentsDeposit
        } satisfies CreateProductPaymentLinkInstallmentsDepositFormData

        return { data, success: true }
      }

      default: {
        throw new Error(
          'Invalid product payment link type: validation passed but no type guard matched'
        )
      }
    }
  }
}
