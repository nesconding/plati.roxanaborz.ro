'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup } from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { VerifyDetailsSection } from '~/client/modules/checkout/checkout-form/stepper/steps/confirmation-step/sections/verify-details-section'

export const ConfirmationStep = withForm({
  defaultValues,
  render: function Render(props) {
    return (
      <FieldGroup>
        <VerifyDetailsSection {...props} />
      </FieldGroup>
    )
  }
})
