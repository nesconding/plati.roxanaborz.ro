'use client'

import { defineStepper } from '~/client/components/ui/stepper'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'

export const { Stepper, useStepper } = defineStepper(
  { id: CreateExtensionPaymentLinkFormStep.BaseInfo },
  { id: CreateExtensionPaymentLinkFormStep.PaymentInfo },
  { id: CreateExtensionPaymentLinkFormStep.Confirmation },
  { id: CreateExtensionPaymentLinkFormStep.Success }
)
