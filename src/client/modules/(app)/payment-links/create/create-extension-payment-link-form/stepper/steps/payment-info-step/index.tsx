'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { DepositFormSection } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/payment-info-step/sections/deposit-form-section'
import { InstallmentsFormSection } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/payment-info-step/sections/installments-form-section'
import { PaymentInfoFormSection } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/payment-info-step/sections/payment-info-form-section'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'

type Products = TRPCRouterOutput['protected']['products']['findAll']
type PaymentSettings =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings']
type FirstPaymentDateAfterDepositOptions =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions']

export const PaymentInfoStep = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOptions,
    paymentSettings: [] as PaymentSettings,
    products: [] as Products
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
