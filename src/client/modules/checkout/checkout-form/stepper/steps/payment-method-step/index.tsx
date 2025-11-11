'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup } from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { PaymentSubmitSection } from '~/client/modules/checkout/checkout-form/stepper/steps/payment-method-step/sections/payment-submit-section'

export const PaymentMethodStep = withForm({
  defaultValues,
  render: function Render(props) {
    return (
      <FieldGroup>
        <PaymentSubmitSection {...props} />
      </FieldGroup>
    )
  }
})
