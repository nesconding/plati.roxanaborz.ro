'use client'

import {
  Blocks,
  Building2,
  CreditCard,
  DoorOpen,
  Globe,
  Home,
  Layers,
  Mail,
  MapPin,
  Route,
  Signpost,
  User
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldLegend, FieldSet } from '~/client/components/ui/field'
import {
  CheckoutFormSection,
  CheckoutFormDefaultValues as defaultValues
} from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'

export const PersonFormSection = withForm({
  defaultValues,

  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.BillingInfo}.forms.person`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          {/* Personal Info Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField name={`${CheckoutFormSection.BillingData}.surname`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: User }]}
                  label={t('fields.surname.title')}
                  placeholder={t('fields.surname.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField name={`${CheckoutFormSection.BillingData}.name`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: User }]}
                  label={t('fields.name.title')}
                  placeholder={t('fields.name.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Contact Info Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField name={`${CheckoutFormSection.BillingData}.email`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: Mail }]}
                  label={t('fields.email.title')}
                  placeholder={t('fields.email.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.phoneNumber`}
            >
              {(field) => (
                <field.Phone
                  label={t('fields.phoneNumber.title')}
                  placeholder={t('fields.phoneNumber.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* CNP */}
          <form.AppField name={`${CheckoutFormSection.BillingData}.cnp`}>
            {(field) => (
              <field.Text
                addons={[{ icon: CreditCard }]}
                label={t('fields.cnp.title')}
                placeholder={t('fields.cnp.placeholder')}
                isRequired
              />
            )}
          </form.AppField>
        </FieldGroup>

        {/* Address Section */}
        <FieldLegend className='mt-6'>{t('address.legend')}</FieldLegend>

        <FieldGroup>
          {/* Street and Number Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.street`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Route }]}
                  label={t('fields.address.street.title')}
                  placeholder={t('fields.address.street.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.streetNumber`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Signpost }]}
                  label={t('fields.address.streetNumber.title')}
                  placeholder={t('fields.address.streetNumber.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Building Details Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.building`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Blocks }]}
                  label={t('fields.address.building.title')}
                  placeholder={t('fields.address.building.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.entrance`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: DoorOpen }]}
                  label={t('fields.address.entrance.title')}
                  placeholder={t('fields.address.entrance.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.floor`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Layers }]}
                  label={t('fields.address.floor.title')}
                  placeholder={t('fields.address.floor.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.apartment`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Home }]}
                  label={t('fields.address.apartment.title')}
                  placeholder={t('fields.address.apartment.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* City and County Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.city`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Building2 }]}
                  label={t('fields.address.city.title')}
                  placeholder={t('fields.address.city.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.county`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.address.county.title')}
                  placeholder={t('fields.address.county.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Postal Code and Country Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.postalCode`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.address.postalCode.title')}
                  placeholder={t('fields.address.postalCode.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.address.country`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Globe }]}
                  label={t('fields.address.country.title')}
                  placeholder={t('fields.address.country.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
