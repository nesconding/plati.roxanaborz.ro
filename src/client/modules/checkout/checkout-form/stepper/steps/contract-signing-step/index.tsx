'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { ConsentSection } from '~/client/modules/checkout/checkout-form/stepper/steps/contract-signing-step/sections/consent-section'
import { ContractDownloadSection } from '~/client/modules/checkout/checkout-form/stepper/steps/contract-signing-step/sections/contract-download-section'

export const ContractSigningStep = withForm({
  defaultValues,
  props: {
    paymentLinkId: ''
  },
  render: function Render(props) {
    return (
      <FieldGroup>
        <ContractDownloadSection {...props} />
        <FieldSeparator />
        <ConsentSection {...props} />
      </FieldGroup>
    )
  }
})
