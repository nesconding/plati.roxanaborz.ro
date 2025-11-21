import { z } from 'zod'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

export const CreateProductPaymentLinkFormSchema = z.object({
  [CreateProductPaymentLinkFormSection.Participants]: z.object({
    callerEmail: z.string(),
    callerName: z.string(),
    scheduledEventId: z.string().nonempty(),
    setterEmail: z.string(),
    setterName: z.string()
  }),
  [CreateProductPaymentLinkFormSection.Product]: z.object({
    contractId: z.string().nonempty(),
    productId: z.string().nonempty()
  }),
  [CreateProductPaymentLinkFormSection.PaymentInfo]: z.object({
    paymentMethodType: z.enum(PaymentMethodType),
    paymentSettingId: z.string().nonempty()
  }),
  [CreateProductPaymentLinkFormSection.Installments]: z.object({
    hasInstallments: z.boolean(),
    productInstallmentId: z.string()
  }),
  [CreateProductPaymentLinkFormSection.Deposit]: z.object({
    depositAmount: z.string().optional(),
    firstPaymentDateAfterDepositOptionId: z.string().optional(),
    hasDeposit: z.boolean()
  })
})
export type CreateProductPaymentLinkFormValues = z.infer<
  typeof CreateProductPaymentLinkFormSchema
>

export const CreateProductPaymentLinkFormDefaultValues: CreateProductPaymentLinkFormValues =
  {
    [CreateProductPaymentLinkFormSection.Participants]: {
      callerEmail: '',
      callerName: '',
      scheduledEventId: '',
      setterEmail: '',
      setterName: ''
    },
    [CreateProductPaymentLinkFormSection.Product]: {
      contractId: '',
      productId: ''
    },
    [CreateProductPaymentLinkFormSection.PaymentInfo]: {
      paymentMethodType: PaymentMethodType.Card,
      paymentSettingId: ''
    },
    [CreateProductPaymentLinkFormSection.Installments]: {
      hasInstallments: false,
      productInstallmentId: ''
    },
    [CreateProductPaymentLinkFormSection.Deposit]: {
      depositAmount: '',
      firstPaymentDateAfterDepositOptionId: '',
      hasDeposit: false
    }
  }
