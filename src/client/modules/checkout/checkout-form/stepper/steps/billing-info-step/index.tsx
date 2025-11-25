'use client'

import { useStore } from '@tanstack/react-form'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import {
  BillingType,
  CheckoutFormDefaultValues as defaultValues,
  CheckoutFormSection
} from '~/client/modules/checkout/checkout-form/schema'
import { BillingTypeSelector } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step/sections/billing-type-selector'
import { CompanyFormSection } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step/sections/company-form-section'
import { PersonFormSection } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step/sections/person-form-section'

export const BillingInfoStep = withForm({
  defaultValues,
  render: function Render(props) {
    const billingType = useStore(
      props.form.store,
      (state) => state.values[CheckoutFormSection.BillingData].type
    )

    return (
      <FieldGroup>
        <BillingTypeSelector {...props} />
        <FieldSeparator />
        {billingType === BillingType.PERSON ? (
          <PersonFormSection {...props} />
        ) : (
          <CompanyFormSection {...props} />
        )}
      </FieldGroup>
    )
  }
})
