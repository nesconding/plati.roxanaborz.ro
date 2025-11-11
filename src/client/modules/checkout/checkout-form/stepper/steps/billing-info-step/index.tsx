'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { AddressFormSection } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step/sections/address-form-section'
import { PersonalDetailsFormSection } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step/sections/personal-details-form-section'

export const BillingInfoStep = withForm({
  defaultValues,
  render: function Render(props) {
    return (
      <FieldGroup>
        <PersonalDetailsFormSection {...props} />
        <FieldSeparator />
        <AddressFormSection {...props} />
      </FieldGroup>
    )
  }
})
