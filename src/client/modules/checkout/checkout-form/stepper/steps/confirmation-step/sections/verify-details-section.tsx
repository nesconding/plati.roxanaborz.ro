'use client'

import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const VerifyDetailsSection = withForm({
  defaultValues,
  render: function Render() {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.Confirmation}.forms.verify-details`
    )
    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <Field>
            <div>Verify details</div>
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
