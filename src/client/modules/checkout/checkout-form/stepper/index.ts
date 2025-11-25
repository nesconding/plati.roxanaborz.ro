'use client'

import { defineStepper } from '~/client/components/ui/stepper'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const { Stepper, useStepper } = defineStepper(
  { id: CheckoutFormStep.BillingInfo },
  { id: CheckoutFormStep.Confirmation },
  { id: CheckoutFormStep.ContractSigning },
  { id: CheckoutFormStep.PaymentMethod }
)
