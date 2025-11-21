'use client'

import { useStore } from '@tanstack/react-form'
import { CalendarSync } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { withForm } from '~/client/components/form/config'
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]

export const InstallmentsFormSection = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    eurToRonRate: '',
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render({ form, paymentSettings, eurToRonRate, products }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-extension-payment-link-form.steps.${CreateExtensionPaymentLinkFormStep.PaymentInfo}.forms.${CreateExtensionPaymentLinkFormSection.Installments}`
    )

    const {
      isInstallmentsSectionDisabledNoInstallments,
      isPaymentMethodTBI,
      extensionInstallments,
      extensionMonths,
      productName
    } = useStore(form.store, ({ values }) => {
      const extensionId =
        values[CreateExtensionPaymentLinkFormSection.Extension].extensionId

      const extension = products
        .flatMap((product) => product.extensions)
        .find((extension) => extension.id === extensionId)
      const extensionInstallments = extension?.installments ?? []

      const productName =
        products.find((product) => product.id === extension?.productId)?.name ??
        ''

      const isPaymentMethodTBI =
        values[CreateExtensionPaymentLinkFormSection.PaymentInfo]
          .paymentMethodType === PaymentMethodType.TBI

      const isInstallmentsSectionDisabledNoInstallments =
        !extensionInstallments || extensionInstallments.length === 0

      return {
        extensionInstallments,
        extensionMonths: extension?.extensionMonths ?? '',
        isInstallmentsSectionDisabledNoInstallments,
        isPaymentMethodTBI,
        productName
      }
    })

    const isSectionDisabled =
      isPaymentMethodTBI || isInstallmentsSectionDisabledNoInstallments

    const description = (() => {
      if (isPaymentMethodTBI) {
        return t.rich('description.disabled-payment-method-tbi', {
          bold: (chunks) => <span className='font-semibold'>{chunks}</span>
        })
      }

      if (isInstallmentsSectionDisabledNoInstallments) {
        return t.rich('description.disabled-no-installments', {
          bold: (chunks) => <span className='font-semibold'>{chunks}</span>,
          extensionMonths,
          productName
        })
      }

      return t('description.default')
    })()

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{description}</FieldDescription>

        <FieldGroup aria-disabled={isSectionDisabled}>
          <form.AppField
            name={`${CreateExtensionPaymentLinkFormSection.Installments}.hasInstallments`}
          >
            {(field) => {
              function onCheckedChange(checked: boolean) {
                field.handleChange(checked)
                if (!checked) {
                  form.resetField(
                    `${CreateExtensionPaymentLinkFormSection.Installments}.extensionInstallmentId`
                  )
                }
              }
              return (
                <field.Switch
                  isDisabled={isSectionDisabled}
                  label={t('fields.hasInstallments.title')}
                  onCheckedChange={onCheckedChange}
                />
              )
            }}
          </form.AppField>

          <form.Subscribe
            selector={({
              values: {
                [CreateExtensionPaymentLinkFormSection.Installments]: {
                  hasInstallments
                },
                [CreateExtensionPaymentLinkFormSection.PaymentInfo]: {
                  paymentSettingId
                }
              }
            }) => {
              const currency = paymentSettings.find(
                (paymentSetting) => paymentSetting.id === paymentSettingId
              )!.currency
              return {
                currency,
                hasInstallments
              }
            }}
          >
            {({ hasInstallments, currency }) => {
              const isFieldDisabled = isSectionDisabled || !hasInstallments

              return (
                <form.AppField
                  name={`${CreateExtensionPaymentLinkFormSection.Installments}.extensionInstallmentId`}
                  validators={{
                    onSubmit: !isFieldDisabled
                      ? z.string().nonempty()
                      : undefined
                  }}
                >
                  {(field) => {
                    return (
                      <field.Select
                        icon={isFieldDisabled ? undefined : CalendarSync}
                        isDisabled={isFieldDisabled}
                        isRequired={!isFieldDisabled}
                        label={t('fields.extensionInstallmentId.title')}
                        options={extensionInstallments}
                        placeholder={
                          isFieldDisabled
                            ? undefined
                            : t('fields.extensionInstallmentId.placeholder')
                        }
                        renderItem={(installment) => {
                          const count = installment.count

                          const pricePerInstallment =
                            currency === PaymentCurrencyType.EUR
                              ? installment.pricePerInstallment
                              : PricingService.convertEURtoRON(
                                  installment.pricePerInstallment,
                                  eurToRonRate
                                )
                          const formattedPrice = PricingService.formatPrice(
                            pricePerInstallment,
                            currency
                          )

                          const totalPrice = PricingService.multiply(
                            pricePerInstallment,
                            installment.count
                          )
                          const formattedTotalPrice =
                            PricingService.formatPrice(totalPrice, currency)

                          return (
                            <div className='flex justify-between gap-2 w-full font-medium items-center'>
                              <p>
                                {t('fields.extensionInstallmentId.item.count', {
                                  count
                                })}
                              </p>
                              <p className='text-muted-foreground max-sm:hidden text-right'>
                                {t(
                                  'fields.extensionInstallmentId.item.formattedPrice',
                                  {
                                    count,
                                    formattedPrice,
                                    formattedTotalPrice
                                  }
                                )}
                              </p>
                            </div>
                          )
                        }}
                        valueKey='id'
                      />
                    )
                  }}
                </form.AppField>
              )
            }}
          </form.Subscribe>
        </FieldGroup>
      </FieldSet>
    )
  }
})
