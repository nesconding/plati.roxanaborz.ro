'use client'

import { Building2, Landmark, MapPin, Route, Signpost } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldLegend, FieldSet } from '~/client/components/ui/field'
import {
  CheckoutFormSection,
  CheckoutFormDefaultValues as defaultValues
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const AddressFormSection = withForm({
  defaultValues,

  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.BillingInfo}.forms.address`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <form.AppField name={`${CheckoutFormSection.Address}.line1`}>
            {(field) => (
              <field.Text
                addons={[{ icon: Route }]}
                label={t('fields.line1.title')}
                placeholder={t('fields.line1.placeholder')}
              />
            )}
          </form.AppField>

          <form.AppField name={`${CheckoutFormSection.Address}.line2`}>
            {(field) => (
              <field.Text
                addons={[{ icon: Signpost }]}
                label={t('fields.line2.title')}
                placeholder={t('fields.line2.placeholder')}
              />
            )}
          </form.AppField>

          <FieldGroup className='sm:flex-row sm:items-start '>
            <form.AppField name={`${CheckoutFormSection.Address}.city`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: Building2 }]}
                  label={t('fields.city.title')}
                  placeholder={t('fields.city.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField name={`${CheckoutFormSection.Address}.postal_code`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.postal_code.title')}
                  placeholder={t('fields.postal_code.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <FieldGroup className='sm:flex-row sm:items-start '>
            <form.AppField name={`${CheckoutFormSection.Address}.state`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.state.title')}
                  placeholder={t('fields.state.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField name={`${CheckoutFormSection.Address}.country`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: Landmark }]}
                  label={t('fields.country.title')}
                  placeholder={t('fields.country.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
