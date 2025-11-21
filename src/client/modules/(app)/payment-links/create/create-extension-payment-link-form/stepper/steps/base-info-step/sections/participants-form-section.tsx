'use client'

import { UserRoundPen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'

import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'

export const ParticipantsFormSection = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  render: function Render({ form }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-extension-payment-link-form.steps.${CreateExtensionPaymentLinkFormStep.BaseInfo}.forms.${CreateExtensionPaymentLinkFormSection.Participants}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.closerName`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.closerName.title')}
                  placeholder={t('fields.closerName.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.closerEmail`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.closerEmail.title')}
                  placeholder={t('fields.closerEmail.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.callerName`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.callerName.title')}
                  placeholder={t('fields.callerName.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.callerEmail`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.callerEmail.title')}
                  placeholder={t('fields.callerEmail.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.setterName`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.setterName.title')}
                  placeholder={t('fields.setterName.placeholder')}
                />
              )}
            </form.AppField>

            <form.AppField
              name={`${CreateExtensionPaymentLinkFormSection.Participants}.setterEmail`}
            >
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  label={t('fields.setterEmail.title')}
                  placeholder={t('fields.setterEmail.placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
