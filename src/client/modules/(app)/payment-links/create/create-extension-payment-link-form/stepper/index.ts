'use client'

import { defineStepper } from '~/client/components/ui/stepper'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'

export const { Stepper, useStepper } = defineStepper(
  { id: CreateProductPaymentLinkFormStep.BaseInfo },
  { id: CreateProductPaymentLinkFormStep.PaymentInfo },
  { id: CreateProductPaymentLinkFormStep.Confirmation },
  { id: CreateProductPaymentLinkFormStep.Success }
)
