'use client'

import {
  Blocks,
  Building,
  Building2,
  CreditCard,
  DoorOpen,
  Globe,
  Home,
  Landmark,
  Layers,
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

export const CompanyFormSection = withForm({
  defaultValues,

  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.BillingInfo}.forms.company`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          {/* Company Name */}
          <form.AppField name={`${CheckoutFormSection.BillingData}.name`}>
            {(field) => (
              <field.Text
                addons={[{ icon: Building }]}
                label={t('fields.name.title')}
                placeholder={t('fields.name.placeholder')}
              />
            )}
          </form.AppField>

          {/* CUI and Registration Number Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField name={`${CheckoutFormSection.BillingData}.cui`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: CreditCard }]}
                  label={t('fields.cui.title')}
                  placeholder={t('fields.cui.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.registrationNumber`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: CreditCard }]}
                  label={t('fields.registrationNumber.title')}
                  placeholder={t('fields.registrationNumber.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Legal Representative */}
          <form.AppField
            name={`${CheckoutFormSection.BillingData}.representativeLegal`}
          >
            {(field) => (
              <field.Text
                addons={[{ icon: User }]}
                label={t('fields.representativeLegal.title')}
                placeholder={t('fields.representativeLegal.placeholder')}
              />
            )}
          </form.AppField>

          {/* Bank Info Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField name={`${CheckoutFormSection.BillingData}.bank`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: Landmark }]}
                  label={t('fields.bank.title')}
                  placeholder={t('fields.bank.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField name={`${CheckoutFormSection.BillingData}.bankAccount`}>
              {(field) => (
                <field.Text
                  addons={[{ icon: CreditCard }]}
                  label={t('fields.bankAccount.title')}
                  placeholder={t('fields.bankAccount.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>

        {/* Social Headquarters Section */}
        <FieldLegend className='mt-6'>
          {t('socialHeadquarters.legend')}
        </FieldLegend>

        <FieldGroup>
          {/* Street and Number Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.street`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Route }]}
                  label={t('fields.socialHeadquarters.street.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.street.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.streetNumber`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Signpost }]}
                  label={t('fields.socialHeadquarters.streetNumber.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.streetNumber.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Building Details Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.building`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Blocks }]}
                  label={t('fields.socialHeadquarters.building.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.building.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.entrance`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: DoorOpen }]}
                  label={t('fields.socialHeadquarters.entrance.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.entrance.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.floor`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Layers }]}
                  label={t('fields.socialHeadquarters.floor.title')}
                  placeholder={t('fields.socialHeadquarters.floor.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.apartment`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Home }]}
                  label={t('fields.socialHeadquarters.apartment.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.apartment.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* City and County Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.city`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Building2 }]}
                  label={t('fields.socialHeadquarters.city.title')}
                  placeholder={t('fields.socialHeadquarters.city.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.county`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.socialHeadquarters.county.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.county.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {/* Postal Code and Country Row */}
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.postalCode`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: MapPin }]}
                  label={t('fields.socialHeadquarters.postalCode.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.postalCode.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CheckoutFormSection.BillingData}.socialHeadquarters.country`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: Globe }]}
                  label={t('fields.socialHeadquarters.country.title')}
                  placeholder={t(
                    'fields.socialHeadquarters.country.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
