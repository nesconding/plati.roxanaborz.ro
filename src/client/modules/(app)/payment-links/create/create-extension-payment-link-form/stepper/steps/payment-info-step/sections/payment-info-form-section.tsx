'use client'

import { NotepadTextDashed, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]

export const PaymentInfoFormSection = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    paymentSettings: [] as PaymentSetting[]
  },
  render: function Render({ form, paymentSettings }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-extension-payment-link-form.steps.${CreateExtensionPaymentLinkFormStep.PaymentInfo}.forms.${CreateExtensionPaymentLinkFormSection.PaymentInfo}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup className='sm:flex-row sm:items-start sm:gap-4'>
          <form.AppField
            name={`${CreateExtensionPaymentLinkFormSection.PaymentInfo}.paymentSettingId`}
          >
            {(field) => (
              <field.Select
                icon={NotepadTextDashed}
                isRequired
                label={t('fields.paymentSettingId.title')}
                options={paymentSettings}
                placeholder={t('fields.paymentSettingId.placeholder')}
                renderItem={({ label, currency, tvaRate, extraTaxRate }) => (
                  <div className='flex justify-between gap-2 w-full items-center'>
                    <p className='font-medium'>{label}</p>

                    <p className='text-muted-foreground text-sm sm:text-xs group-data-[slot=select-trigger]/select-trigger:hidden'>
                      {t.rich('fields.paymentSettingId.itemDetails', {
                        bold: (chunks) => (
                          <span className='font-semibold'>{chunks}</span>
                        ),
                        currency,
                        extraTaxRate,
                        muted: (chunks) => (
                          <span className='text-muted-foreground'>
                            {chunks}
                          </span>
                        ),
                        tvaRate
                      })}
                    </p>
                  </div>
                )}
                valueKey='id'
              />
            )}
          </form.AppField>

          <form.AppField
            name={`${CreateExtensionPaymentLinkFormSection.PaymentInfo}.paymentMethodType`}
          >
            {(field) => (
              <field.Select
                disabled={[{ value: PaymentMethodType.BankTransfer }]}
                icon={Wallet}
                isRequired
                label={t('fields.paymentMethodType.title')}
                options={Object.values(PaymentMethodType).map((value) => ({
                  value
                }))}
                placeholder={t('fields.paymentMethodType.placeholder')}
                renderItem={({ value }) => (
                  <p className='font-medium'>
                    {t(`fields.paymentMethodType.item.${value}`)}
                  </p>
                )}
                valueKey='value'
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FieldSet>
    )
  }
})
