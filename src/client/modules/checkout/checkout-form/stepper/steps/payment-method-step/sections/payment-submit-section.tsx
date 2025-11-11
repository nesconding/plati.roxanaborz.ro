'use client'

import { PaymentElement } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const PaymentSubmitSection = withForm({
  defaultValues,
  render: function Render() {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.PaymentMethod}.forms.payment-submit`
    )
    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <Field>
            <PaymentElement
              options={{ layout: 'tabs', terms: { card: 'never' } }}
            />
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
