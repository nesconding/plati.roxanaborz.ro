import { z } from 'zod'
import type { CreateExtensionPaymentLinkFormValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import type {
  CreateExtensionPaymentLinkDepositFormData,
  CreateExtensionPaymentLinkInstallmentsDataDepositFormData,
  CreateExtensionPaymentLinkInstallmentsFormData,
  CreateExtensionPaymentLinkIntegralFormData
} from '~/shared/create-extension-payment-link-form/data'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { NumericString } from '~/shared/validation/utils'
import { PaymentLinkType } from '../enums/payment-link-type'

// Payment info
const paymentInfo = z.object({
  paymentMethodType: z.enum(PaymentMethodType),
  paymentSettingId: z.cuid2()
})

// Extension
const extension = z.object({
  contractId: z.cuid2(),
  extensionId: z.cuid2(),
  membershipId: z.cuid2()
})

// Participants
const participants = z.object({
  callerEmail: z.string(),
  callerName: z.string(),
  closerEmail: z.string(),
  closerName: z.string(),
  setterEmail: z.string(),
  setterName: z.string()
})

// Installments
const isNotRecurring = z.object({
  extensionInstallmentId: z.literal(''),
  hasInstallments: z.literal(false)
})

const hasInstallments = z.object({
  extensionInstallmentId: z.cuid2(),
  hasInstallments: z.literal(true)
})

// Deposit
const doesNotHaveDeposit = z.object({
  depositAmount: z.literal('').optional(),
  firstPaymentDateAfterDepositOptionId: z.literal('').optional(),
  hasDeposit: z.literal(false)
})

const hasDeposit = z.object({
  depositAmount: NumericString(),
  firstPaymentDateAfterDepositOptionId: z.cuid2(),
  hasDeposit: z.literal(true)
})

export namespace CreateExtensionPaymentLinkFormParser {
  export namespace Validation {
    const base = z.object({
      [CreateExtensionPaymentLinkFormSection.Extension]: extension,
      [CreateExtensionPaymentLinkFormSection.Participants]: participants,
      [CreateExtensionPaymentLinkFormSection.PaymentInfo]: paymentInfo
    })

    export const Integral = base.extend({
      [CreateExtensionPaymentLinkFormSection.Deposit]: doesNotHaveDeposit,
      [CreateExtensionPaymentLinkFormSection.Installments]: isNotRecurring
    })
    export type Integral = z.infer<
      typeof CreateExtensionPaymentLinkFormParser.Validation.Integral
    >

    export const Deposit = base.extend({
      [CreateExtensionPaymentLinkFormSection.Deposit]: hasDeposit,
      [CreateExtensionPaymentLinkFormSection.Installments]: isNotRecurring
    })
    export type Deposit = z.infer<
      typeof CreateExtensionPaymentLinkFormParser.Validation.Deposit
    >

    export const Installments = base.extend({
      [CreateExtensionPaymentLinkFormSection.Deposit]: doesNotHaveDeposit,
      [CreateExtensionPaymentLinkFormSection.Installments]: hasInstallments
    })
    export type Installments = z.infer<
      typeof CreateExtensionPaymentLinkFormParser.Validation.Installments
    >

    export const InstallmentsDeposit = base.extend({
      [CreateExtensionPaymentLinkFormSection.Deposit]: hasDeposit,
      [CreateExtensionPaymentLinkFormSection.Installments]: hasInstallments
    })
    export type InstallmentsDeposit = z.infer<
      typeof CreateExtensionPaymentLinkFormParser.Validation.InstallmentsDeposit
    >

    export const Schema = z.union([
      CreateExtensionPaymentLinkFormParser.Validation.Integral,
      CreateExtensionPaymentLinkFormParser.Validation.Deposit,
      CreateExtensionPaymentLinkFormParser.Validation.Installments,
      CreateExtensionPaymentLinkFormParser.Validation.InstallmentsDeposit
    ])
    export type Schema = z.infer<typeof Schema>
  }

  export namespace TypeGuards {
    function checkIsExtensionProduct({
      extensionId,
      membershipId
    }: {
      extensionId: string
      membershipId: string
    }): boolean {
      return extensionId !== '' && membershipId !== ''
    }

    function checkExtensionProductDoesNotHaveInstallments({
      extensionInstallmentId,
      hasInstallments
    }: {
      extensionInstallmentId: string
      hasInstallments: boolean
    }) {
      return extensionInstallmentId === '' && hasInstallments === false
    }

    function checkExtensionProductHasInstallments({
      extensionInstallmentId,
      hasInstallments
    }: {
      extensionInstallmentId: string
      hasInstallments: boolean
    }) {
      return extensionInstallmentId !== '' && hasInstallments === true
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

    export function isIntegral(
      input: CreateExtensionPaymentLinkFormParser.Validation.Schema
    ): input is CreateExtensionPaymentLinkFormParser.Validation.Integral {
      return (
        checkIsExtensionProduct(input.extension) &&
        checkExtensionProductDoesNotHaveInstallments(input.installments) &&
        checkDoesNotHaveDeposit(input.deposit)
      )
    }

    export function hasDeposit(
      input: CreateExtensionPaymentLinkFormParser.Validation.Schema
    ): input is CreateExtensionPaymentLinkFormParser.Validation.Deposit {
      return (
        checkIsExtensionProduct(input.extension) &&
        checkExtensionProductDoesNotHaveInstallments(input.installments) &&
        checkHasDeposit(input.deposit)
      )
    }

    export function isInstallments(
      input: CreateExtensionPaymentLinkFormParser.Validation.Schema
    ): input is CreateExtensionPaymentLinkFormParser.Validation.Installments {
      return (
        checkIsExtensionProduct(input.extension) &&
        checkExtensionProductHasInstallments(input.installments) &&
        checkDoesNotHaveDeposit(input.deposit)
      )
    }

    export function isInstallmentsDeposit(
      input: CreateExtensionPaymentLinkFormParser.Validation.Schema
    ): input is CreateExtensionPaymentLinkFormParser.Validation.InstallmentsDeposit {
      return (
        checkIsExtensionProduct(input.extension) &&
        checkExtensionProductHasInstallments(input.installments) &&
        checkHasDeposit(input.deposit)
      )
    }
  }

  export async function Parse(values: CreateExtensionPaymentLinkFormValues) {
    const result =
      await CreateExtensionPaymentLinkFormParser.Validation.Schema.safeParseAsync(
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
      // Extension
      case CreateExtensionPaymentLinkFormParser.TypeGuards.isIntegral(
        result.data
      ): {
        const data = {
          callerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerEmail,
          callerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerName,
          closerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerEmail,
          closerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerName,
          contractId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .contractId,
          extensionId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .extensionId,
          membershipId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .membershipId,
          paymentMethodType:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          setterEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterEmail,
          setterName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Integral
        } satisfies CreateExtensionPaymentLinkIntegralFormData

        return { data, success: true }
      }

      case CreateExtensionPaymentLinkFormParser.TypeGuards.hasDeposit(
        result.data
      ): {
        const data = {
          callerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerEmail,
          callerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerName,
          closerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerEmail,
          closerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerName,
          contractId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .contractId,
          depositAmount:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .depositAmount,
          extensionId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .extensionId,
          firstPaymentDateAfterDepositOptionId:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .firstPaymentDateAfterDepositOptionId,
          hasDeposit:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .hasDeposit,
          membershipId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .membershipId,
          paymentMethodType:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          setterEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterEmail,
          setterName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Deposit
        } satisfies CreateExtensionPaymentLinkDepositFormData

        return { data, success: true }
      }

      case CreateExtensionPaymentLinkFormParser.TypeGuards.isInstallments(
        result.data
      ): {
        const data = {
          callerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerEmail,
          callerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerName,
          closerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerEmail,
          closerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerName,
          contractId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .contractId,
          extensionId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .extensionId,
          extensionInstallmentId:
            result.data[CreateExtensionPaymentLinkFormSection.Installments]
              .extensionInstallmentId,
          hasInstallments:
            result.data[CreateExtensionPaymentLinkFormSection.Installments]
              .hasInstallments,
          membershipId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .membershipId,
          paymentMethodType:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          setterEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterEmail,
          setterName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.Installments
        } satisfies CreateExtensionPaymentLinkInstallmentsFormData

        return { data, success: true }
      }

      case CreateExtensionPaymentLinkFormParser.TypeGuards.isInstallmentsDeposit(
        result.data
      ): {
        const data = {
          callerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerEmail,
          callerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .callerName,
          closerEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerEmail,
          closerName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .closerName,
          contractId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .contractId,
          depositAmount:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .depositAmount,
          extensionId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .extensionId,
          extensionInstallmentId:
            result.data[CreateExtensionPaymentLinkFormSection.Installments]
              .extensionInstallmentId,
          firstPaymentDateAfterDepositOptionId:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .firstPaymentDateAfterDepositOptionId,
          hasDeposit:
            result.data[CreateExtensionPaymentLinkFormSection.Deposit]
              .hasDeposit,
          hasInstallments:
            result.data[CreateExtensionPaymentLinkFormSection.Installments]
              .hasInstallments,
          membershipId:
            result.data[CreateExtensionPaymentLinkFormSection.Extension]
              .membershipId,
          paymentMethodType:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentMethodType,
          paymentSettingId:
            result.data[CreateExtensionPaymentLinkFormSection.PaymentInfo]
              .paymentSettingId,
          setterEmail:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterEmail,
          setterName:
            result.data[CreateExtensionPaymentLinkFormSection.Participants]
              .setterName,
          type: PaymentLinkType.InstallmentsDeposit
        } satisfies CreateExtensionPaymentLinkInstallmentsDataDepositFormData

        return { data, success: true }
      }

      default: {
        throw new Error(
          'Invalid extension payment link type: validation passed but no type guard matched'
        )
      }
    }
  }
}
