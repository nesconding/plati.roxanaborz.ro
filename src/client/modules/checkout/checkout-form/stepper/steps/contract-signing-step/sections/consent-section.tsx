'use client'

import { useTranslations } from 'next-intl'

import { withForm } from '~/client/components/form/config'
import { Checkbox } from '~/client/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { Label } from '~/client/components/ui/label'
import {
  CheckoutFormSection,
  CheckoutFormDefaultValues as defaultValues
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const ConsentSection = withForm({
  defaultValues,
  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.ContractSigning}.forms.consent`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup className='mt-4 gap-4'>
          <form.AppField
            name={`${CheckoutFormSection.ContractConsent}.dataProcessingConsent`}
          >
            {(field) => (
              <Field orientation='horizontal'>
                <Checkbox
                  checked={field.state.value}
                  id='data-processing-consent'
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <FieldContent>
                  <FieldLabel htmlFor='data-processing-consent'>
                    {t('fields.dataProcessingConsent.label')}
                  </FieldLabel>
                  <FieldDescription>
                    {t('fields.dataProcessingConsent.description')}
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </FieldContent>
              </Field>
            )}
          </form.AppField>

          <form.AppField
            name={`${CheckoutFormSection.ContractConsent}.contractTermsConsent`}
          >
            {(field) => (
              <Field orientation='horizontal'>
                <Checkbox
                  checked={field.state.value}
                  id='contract-terms-consent'
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />

                <FieldContent>
                  <FieldLabel htmlFor='contract-terms-consent'>
                    {t('fields.contractTermsConsent.label')}
                  </FieldLabel>
                  <FieldDescription>
                    {t('fields.contractTermsConsent.description')}
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </FieldContent>
              </Field>
            )}
          </form.AppField>
        </FieldGroup>
      </FieldSet>
    )
  }
})
