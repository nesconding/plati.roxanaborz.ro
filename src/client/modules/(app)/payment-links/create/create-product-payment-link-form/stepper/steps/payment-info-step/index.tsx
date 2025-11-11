'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { DepositFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/deposit-form-section'
import { InstallmentsFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/installments-form-section'
import { PaymentInfoFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/payment-info-form-section'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateProductPaymentLinkFormDefaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]
type FirstPaymentDateAfterDepositOption =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions'][number]

export const PaymentInfoStep = withForm({
  defaultValues: CreateProductPaymentLinkFormDefaultValues,
  props: {
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOption[],
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render(props) {
    return (
      <FieldGroup>
        <PaymentInfoFormSection {...props} />
        <FieldSeparator />
        <InstallmentsFormSection {...props} />
        <FieldSeparator />
        <DepositFormSection {...props} />
      </FieldGroup>
    )
  }
})
