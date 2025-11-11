'use client'

import { Mail, UserRoundPen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldLegend, FieldSet } from '~/client/components/ui/field'
import {
  CheckoutFormSection,
  CheckoutFormDefaultValues as defaultValues
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const PersonalDetailsFormSection = withForm({
  defaultValues,

  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.BillingInfo}.forms.personal-details`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <form.AppField name={`${CheckoutFormSection.PersonalDetails}.name`}>
            {(field) => (
              <field.Text
                addons={[{ icon: UserRoundPen }]}
                label={t('fields.name.title')}
                placeholder={t('fields.name.placeholder')}
              />
            )}
          </form.AppField>

          <div className='flex items-start justify-between gap-3'>
            <form.AppField
              name={`${CheckoutFormSection.PersonalDetails}.email`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Mail }]}
                  label={t('fields.email.title')}
                  placeholder={t('fields.email.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.PersonalDetails}.phoneNumber`}
            >
              {(field) => (
                <field.Phone
                  label={t('fields.phoneNumber.title')}
                  placeholder={t('fields.phoneNumber.placeholder')}
                />
              )}
            </form.AppField>
          </div>
        </FieldGroup>
      </FieldSet>
    )
  }
})
