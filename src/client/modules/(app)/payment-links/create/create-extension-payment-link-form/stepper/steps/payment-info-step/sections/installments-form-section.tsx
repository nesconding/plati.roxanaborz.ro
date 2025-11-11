'use client'

import { useStore } from '@tanstack/react-form'
import { CalendarSync } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { z } from 'zod'
import { withForm } from '~/client/components/form/config'
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { CreateProductPaymentLinkFormDefaultValues as defaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]

export const InstallmentsFormSection = withForm({
  defaultValues,
  props: {
    currentConfiguration: [] as React.ReactNode[],
    eurToRonRate: '',
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render({
    form,
    paymentSettings,
    currentConfiguration,
    eurToRonRate,
    products
  }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.PaymentInfo}.forms.${CreateProductPaymentLinkFormSection.Installments}`
    )

    const {
      // extensionInstallments,
      isInstallmentsSectionDisabledNoInstallments,
      isPaymentMethodTBI,
      productInstallments
    } = useStore(form.store, ({ values }) => {
      const productId =
        values[CreateProductPaymentLinkFormSection.Product].productId
      // const extensionId =
      //   values[CreateProductPaymentLinkFormSection.Product].extensionId

      const product = products.find((product) => product.id === productId)
      // const extension = product?.extensions.find(
      //   (extension) => extension.id === extensionId
      // )

      // const extensionInstallments = extension?.installments ?? []
      const productInstallments = product?.installments ?? []

      const isPaymentMethodTBI =
        values[CreateProductPaymentLinkFormSection.PaymentInfo]
          .paymentMethodType === PaymentMethodType.TBI
      const productType =
        values[CreateProductPaymentLinkFormSection.Product].productType

      const isInstallmentsSectionDisabledNoInstallments =
        productType === PaymentProductType.Product &&
        (!productInstallments || productInstallments.length === 0)
      // const isInstallmentsSectionDisabledNoInstallments =
      //   (productType === PaymentProductType.Product &&
      //     (!productInstallments || productInstallments.length === 0)) ||
      //   (productType === PaymentProductType.Extension &&
      //     (!extensionInstallments || extensionInstallments.length === 0))

      return {
        // extensionInstallments,
        isInstallmentsSectionDisabledNoInstallments,
        isPaymentMethodTBI,
        productInstallments
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
        return (
          <span className='flex items-center gap-1 w-full flex-wrap'>
            <span>{t('description.disabled-no-installments')}</span>
            {currentConfiguration}
          </span>
        )
      }

      return t('description.default')
    })()

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{description}</FieldDescription>

        <FieldGroup aria-disabled={isSectionDisabled}>
          <form.AppField
            name={`${CreateProductPaymentLinkFormSection.Installments}.hasInstallments`}
          >
            {(field) => {
              function onCheckedChange(checked: boolean) {
                field.handleChange(checked)
                if (!checked) {
                  form.resetField(
                    `${CreateProductPaymentLinkFormSection.Installments}.productInstallmentId`
                  )
                  // form.resetField(
                  //   `${CreateProductPaymentLinkFormSection.Installments}.extensionInstallmentId`
                  // )
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
                [CreateProductPaymentLinkFormSection.Installments]: {
                  hasInstallments
                },
                [CreateProductPaymentLinkFormSection.Product]: { productType },
                [CreateProductPaymentLinkFormSection.PaymentInfo]: {
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
                // productType
              }
            }}
          >
            {({
              hasInstallments,
              // productType,
              currency
            }) => {
              const isFieldDisabled = isSectionDisabled || !hasInstallments

              return (
                <form.AppField
                  name={`${CreateProductPaymentLinkFormSection.Installments}.productInstallmentId`}
                  validators={{
                    onSubmit: !isFieldDisabled
                      ? z.string().nonempty()
                      : undefined
                  }}
                >
                  {(field) => {
                    // if (productType === PaymentProductType.Product) {
                    return (
                      <field.Select
                        icon={isFieldDisabled ? undefined : CalendarSync}
                        isDisabled={isFieldDisabled}
                        isRequired={!isFieldDisabled}
                        label={t('fields.productInstallmentId.title')}
                        options={productInstallments}
                        placeholder={
                          isFieldDisabled
                            ? undefined
                            : t('fields.productInstallmentId.placeholder')
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
                                {t('fields.productInstallmentId.item.count', {
                                  count
                                })}
                              </p>
                              <p className='text-muted-foreground max-sm:hidden text-right'>
                                {t(
                                  'fields.productInstallmentId.item.formattedPrice',
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
              // }

              // return (
              //   <form.AppField
              //     name={`${CreateProductPaymentLinkFormSection.Installments}.extensionInstallmentId`}
              //     validators={{
              //       onSubmit: !isFieldDisabled
              //         ? z.string().nonempty()
              //         : undefined
              //     }}
              //   >
              //     {(field) => {
              //       return (
              //         <field.Select
              //           icon={isFieldDisabled ? undefined : CalendarSync}
              //           isDisabled={isFieldDisabled}
              //           isRequired={!isFieldDisabled}
              //           label={t('fields.extensionInstallmentId.title')}
              //           options={extensionInstallments}
              //           placeholder={
              //             isFieldDisabled
              //               ? undefined
              //               : t('fields.extensionInstallmentId.placeholder')
              //           }
              //           renderItem={(installment) => {
              //             const count = installment.count

              //             const pricePerInstallment =
              //               currency === PaymentCurrencyType.EUR
              //                 ? installment.pricePerInstallment
              //                 : PricingService.convertEURtoRON(
              //                     installment.pricePerInstallment,
              //                     eurToRonRate
              //                   )
              //             const formattedPrice = PricingService.formatPrice(
              //               pricePerInstallment,
              //               currency
              //             )

              //             const totalPrice = PricingService.multiply(
              //               pricePerInstallment,
              //               installment.count
              //             )
              //             const formattedTotalPrice =
              //               PricingService.formatPrice(totalPrice, currency)

              //             return (
              //               <div className='flex justify-between gap-2 w-full font-medium items-center'>
              //                 <p>
              //                   {t('fields.extensionInstallmentId.item.count', {
              //                     count
              //                   })}
              //                 </p>
              //                 <p className='text-muted-foreground max-sm:hidden text-right'>
              //                   {t(
              //                     'fields.extensionInstallmentId.item.formattedPrice',
              //                     {
              //                       count,
              //                       formattedPrice,
              //                       formattedTotalPrice
              //                     }
              //                   )}
              //                 </p>
              //               </div>
              //             )
              //           }}
              //           valueKey='id'
              //         />
              //       )
              //     }}
              //   </form.AppField>
              // )
            }}
          </form.Subscribe>
        </FieldGroup>
      </FieldSet>
    )
  }
})
