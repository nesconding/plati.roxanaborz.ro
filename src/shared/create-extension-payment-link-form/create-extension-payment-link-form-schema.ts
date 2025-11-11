import { z } from 'zod'

import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { CreateExtensionPaymentLinkFormSection } from './enums/create-extension-payment-link-form-sections'

export const CreateExtensionPaymentLinkFormSchema = z.object({
  [CreateExtensionPaymentLinkFormSection.Extension]: z.object({
    extensionId: z.string(),
    membershipId: z.string().nonempty()
  }),
  [CreateExtensionPaymentLinkFormSection.PaymentInfo]: z.object({
    paymentMethodType: z.enum(PaymentMethodType),
    paymentSettingId: z.string().nonempty()
  }),
  [CreateExtensionPaymentLinkFormSection.Installments]: z.object({
    extensionInstallmentId: z.string(),
    hasInstallments: z.boolean(),
    productInstallmentId: z.string()
  }),
  [CreateExtensionPaymentLinkFormSection.Deposit]: z.object({
    depositAmount: z.string().optional(),
    firstPaymentDateAfterDepositOptionId: z.string().optional(),
    hasDeposit: z.boolean()
  })
})
export type CreateExtensionPaymentLinkFormValues = z.infer<
  typeof CreateExtensionPaymentLinkFormSchema
>

export const CreateExtensionPaymentLinkFormDefaultValues: CreateExtensionPaymentLinkFormValues =
  {
    [CreateExtensionPaymentLinkFormSection.Extension]: {
      extensionId: '',
      membershipId: ''
    },
    [CreateExtensionPaymentLinkFormSection.PaymentInfo]: {
      paymentMethodType: PaymentMethodType.Card,
      paymentSettingId: ''
    },
    [CreateExtensionPaymentLinkFormSection.Installments]: {
      extensionInstallmentId: '',
      hasInstallments: false,
      productInstallmentId: ''
    },
    [CreateExtensionPaymentLinkFormSection.Deposit]: {
      depositAmount: '',
      firstPaymentDateAfterDepositOptionId: '',
      hasDeposit: false
    }
  }
