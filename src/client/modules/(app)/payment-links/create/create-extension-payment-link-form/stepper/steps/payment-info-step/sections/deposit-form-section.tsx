'use client'

import { useStore } from '@tanstack/react-form'
import Decimal from 'decimal.js-light'
import { BanknoteArrowUp, Calendar1, CircleAlert, Dot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { z } from 'zod'
import { withForm } from '~/client/components/form/config'
import {
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { cn } from '~/client/lib/utils'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { CreateProductPaymentLinkFormDefaultValues as defaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { NumericString } from '~/shared/validation/utils'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]
type FirstPaymentDateAfterDepositOption =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions'][number]

export const DepositFormSection = withForm({
  defaultValues,
  props: {
    currentConfiguration: [] as React.ReactNode[],
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOption[],
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render({
    paymentSettings,
    currentConfiguration,
    firstPaymentDateAfterDepositOptions,
    form,
    eurToRonRate,
    products
  }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.PaymentInfo}.forms.${CreateProductPaymentLinkFormSection.Deposit}`
    )

    const {
      currency,
      maxDepositAmount,
      formattedMinDepositAmountEUR,
      formattedMinDepositAmountRON,
      isDepositSectionDisabledNoDeposit,
      isPaymentMethodTBI,
      tvaRate
    } = useStore(form.store, ({ values }) => {
      const productType =
        values[CreateProductPaymentLinkFormSection.Product].productType

      const paymentSetting = paymentSettings.find(
        (paymentSetting) =>
          paymentSetting.id ===
          values[CreateProductPaymentLinkFormSection.PaymentInfo]
            .paymentSettingId
      )!
      const currency = paymentSetting.currency
      const tvaRate = paymentSetting.tvaRate

      const product = products.find(
        (product) =>
          product.id ===
          values[CreateProductPaymentLinkFormSection.Product].productId
      )
      const extension =
        productType === PaymentProductType.Extension
          ? product?.extensions.find(
              (extension) =>
                extension.id ===
                values[CreateProductPaymentLinkFormSection.Product].extensionId
            )
          : undefined

      const isDepositSectionDisabledNoDeposit =
        productType === PaymentProductType.Product
          ? !product?.isDepositAmountEnabled
          : !extension?.isDepositAmountEnabled

      const isPaymentMethodTBI =
        values[CreateProductPaymentLinkFormSection.PaymentInfo]
          .paymentMethodType === PaymentMethodType.TBI

      const minDepositAmount =
        (productType === PaymentProductType.Product
          ? product?.minDepositAmount
          : extension?.minDepositAmount) ?? '0'

      const priceWithoutTVA =
        (productType === PaymentProductType.Product
          ? values[CreateProductPaymentLinkFormSection.Installments]
              .hasInstallments &&
            values[CreateProductPaymentLinkFormSection.Installments]
              .productInstallmentId
            ? (() => {
                const installment = product?.installments.find(
                  (installment) =>
                    installment.id ===
                    values[CreateProductPaymentLinkFormSection.Installments]
                      .productInstallmentId
                )
                if (!installment) return '0'
                return PricingService.multiply(
                  installment.pricePerInstallment,
                  installment.count
                )
              })()
            : product?.price
          : values[CreateProductPaymentLinkFormSection.Installments]
                .hasInstallments &&
              values[CreateProductPaymentLinkFormSection.Installments]
                .extensionInstallmentId
            ? (() => {
                const installment = extension?.installments.find(
                  (installment) =>
                    installment.id ===
                    values[CreateProductPaymentLinkFormSection.Installments]
                      .extensionInstallmentId
                )
                if (!installment) return '0'
                return PricingService.multiply(
                  installment.pricePerInstallment,
                  installment.count
                )
              })()
            : extension?.price) ?? '0'

      const priceWithTVA = PricingService.addTax(priceWithoutTVA, tvaRate)

      const formattedMinDepositAmountEUR = PricingService.formatPrice(
        minDepositAmount,
        PaymentCurrencyType.EUR
      )
      const formattedMinDepositAmountRON = PricingService.formatPrice(
        PricingService.convertEURtoRON(Number(minDepositAmount), eurToRonRate),
        PaymentCurrencyType.RON
      )

      const maxDepositAmount =
        currency === PaymentCurrencyType.EUR
          ? Number(priceWithTVA)
          : PricingService.convertEURtoRON(
              Number(priceWithTVA),
              eurToRonRate
            ).toNumber()

      return {
        currency,
        formattedMinDepositAmountEUR,
        formattedMinDepositAmountRON,
        isDepositSectionDisabledNoDeposit,
        isPaymentMethodTBI,
        maxDepositAmount,
        tvaRate
      }
    })

    const isDisabled = isPaymentMethodTBI || isDepositSectionDisabledNoDeposit

    const description = (() => {
      if (isPaymentMethodTBI) {
        return t.rich('description.disabled-payment-method-tbi', {
          bold: (chunks) => <span className='font-semibold'>{chunks}</span>
        })
      }

      if (isDepositSectionDisabledNoDeposit) {
        return (
          <span className='flex items-center gap-1 w-full flex-wrap'>
            <span>{t('description.disabled-no-deposit')}</span>
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

        <FieldGroup>
          <form.AppField
            name={`${CreateProductPaymentLinkFormSection.Deposit}.hasDeposit`}
          >
            {(field) => (
              <field.Switch
                isDisabled={isDisabled}
                label={t('fields.hasDeposit.title')}
                onCheckedChange={(checked) => {
                  field.handleChange(checked)
                  if (!checked) {
                    form.resetField(
                      `${CreateProductPaymentLinkFormSection.Deposit}.depositAmount`
                    )
                    form.resetField(
                      `${CreateProductPaymentLinkFormSection.Deposit}.firstPaymentDateAfterDepositOptionId`
                    )
                  }
                }}
              />
            )}
          </form.AppField>

          <form.Subscribe
            selector={({
              values: {
                [CreateProductPaymentLinkFormSection.Deposit]: { hasDeposit }
              }
            }) => hasDeposit}
          >
            {(hasDeposit) => {
              const isFieldDisabled = isDisabled || !hasDeposit

              return (
                <FieldGroup className='sm:flex-row sm:items-start max-sm:gap-7!'>
                  <FieldGroup>
                    <form.AppField
                      name={`${CreateProductPaymentLinkFormSection.Deposit}.depositAmount`}
                      validators={{
                        onSubmit: !isFieldDisabled ? NumericString() : undefined
                      }}
                    >
                      {(field) => (
                        <field.Number
                          addons={
                            isFieldDisabled
                              ? undefined
                              : [
                                  {
                                    align: 'inline-start',
                                    icon: BanknoteArrowUp
                                  },
                                  { align: 'inline-end', text: currency }
                                ]
                          }
                          isDisabled={isFieldDisabled}
                          isRequired={!isFieldDisabled}
                          label={t('fields.depositAmount.title', { tvaRate })}
                          max={maxDepositAmount}
                          min={0}
                          placeholder={
                            isFieldDisabled
                              ? undefined
                              : t('fields.depositAmount.placeholder')
                          }
                          step={0.01}
                        />
                      )}
                    </form.AppField>

                    <form.Subscribe
                      selector={({ values }) => {
                        const productType =
                          values[CreateProductPaymentLinkFormSection.Product]
                            .productType

                        const paymentSetting = paymentSettings.find(
                          (paymentSetting) =>
                            paymentSetting.id ===
                            values[
                              CreateProductPaymentLinkFormSection.PaymentInfo
                            ].paymentSettingId
                        )!
                        const currency = paymentSetting.currency
                        const tvaRate = paymentSetting.tvaRate
                        const extraTaxRate = paymentSetting.extraTaxRate

                        const product = products.find(
                          (product) =>
                            product.id ===
                            values[CreateProductPaymentLinkFormSection.Product]
                              .productId
                        )
                        const extension =
                          productType === PaymentProductType.Extension
                            ? product?.extensions.find(
                                (extension) =>
                                  extension.id ===
                                  values[
                                    CreateProductPaymentLinkFormSection.Product
                                  ].extensionId
                              )
                            : undefined

                        const minDepositAmount =
                          (productType === PaymentProductType.Product
                            ? product?.minDepositAmount
                            : extension?.minDepositAmount) ?? '0'

                        const priceWithoutTVA =
                          (productType === PaymentProductType.Product
                            ? values[
                                CreateProductPaymentLinkFormSection.Installments
                              ].hasInstallments &&
                              values[
                                CreateProductPaymentLinkFormSection.Installments
                              ].productInstallmentId
                              ? (() => {
                                  const installment =
                                    product?.installments.find(
                                      (installment) =>
                                        installment.id ===
                                        values[
                                          CreateProductPaymentLinkFormSection
                                            .Installments
                                        ].productInstallmentId
                                    )
                                  if (!installment) return '0'
                                  return PricingService.multiply(
                                    installment.pricePerInstallment,
                                    installment.count
                                  )
                                })()
                              : product?.price
                            : values[
                                  CreateProductPaymentLinkFormSection
                                    .Installments
                                ].hasInstallments &&
                                values[
                                  CreateProductPaymentLinkFormSection
                                    .Installments
                                ].extensionInstallmentId
                              ? (() => {
                                  const installment =
                                    extension?.installments.find(
                                      (installment) =>
                                        installment.id ===
                                        values[
                                          CreateProductPaymentLinkFormSection
                                            .Installments
                                        ].extensionInstallmentId
                                    )
                                  if (!installment) return '0'
                                  return PricingService.multiply(
                                    installment.pricePerInstallment,
                                    installment.count
                                  )
                                })()
                              : extension?.price) ?? '0'

                        const priceWithTVA = PricingService.addTax(
                          PricingService.addTax(priceWithoutTVA, tvaRate),
                          extraTaxRate
                        )

                        const formattedEUR = PricingService.formatPrice(
                          1,
                          PaymentCurrencyType.EUR
                        )
                        const formattedEURToRONRate =
                          PricingService.formatPrice(
                            eurToRonRate,
                            PaymentCurrencyType.RON
                          )

                        const formattedMinDepositAmountEUR =
                          PricingService.formatPrice(
                            minDepositAmount,
                            PaymentCurrencyType.EUR
                          )
                        const formattedMinDepositAmountRON =
                          PricingService.formatPrice(
                            PricingService.convertEURtoRON(
                              Number(minDepositAmount),
                              eurToRonRate
                            ),
                            PaymentCurrencyType.RON
                          )

                        const formattedPriceInEUR = PricingService.formatPrice(
                          priceWithTVA,
                          PaymentCurrencyType.EUR
                        )

                        const formattedPriceInRON = PricingService.formatPrice(
                          PricingService.convertEURtoRON(
                            priceWithTVA,
                            eurToRonRate
                          ),
                          PaymentCurrencyType.RON
                        )

                        const min = {
                          message:
                            currency === PaymentCurrencyType.EUR
                              ? t.rich('fields.depositAmount.warning.min.EUR', {
                                  bold: (chunks) => (
                                    <span className='font-medium'>
                                      {chunks}
                                    </span>
                                  ),
                                  formattedMinDepositAmountEUR,
                                  tvaRate
                                })
                              : t.rich('fields.depositAmount.warning.min.RON', {
                                  bold: (chunks) => (
                                    <span className='font-medium'>
                                      {chunks}
                                    </span>
                                  ),
                                  formattedEUR,
                                  formattedEURToRONRate,
                                  formattedMinDepositAmountEUR,
                                  formattedMinDepositAmountRON,
                                  tvaRate
                                }),
                          value:
                            currency === PaymentCurrencyType.EUR
                              ? Number(minDepositAmount)
                              : PricingService.convertEURtoRON(
                                  Number(minDepositAmount),
                                  eurToRonRate
                                ).toNumber()
                        }

                        const max = {
                          message:
                            currency === PaymentCurrencyType.EUR
                              ? t.rich('fields.depositAmount.warning.max.EUR', {
                                  bold: (chunks) => (
                                    <span className='font-medium'>
                                      {chunks}
                                    </span>
                                  ),
                                  formattedPriceInEUR,
                                  tvaRate
                                })
                              : t.rich('fields.depositAmount.warning.max.RON', {
                                  bold: (chunks) => (
                                    <span className='font-medium'>
                                      {chunks}
                                    </span>
                                  ),
                                  formattedEUR,
                                  formattedEURToRONRate,
                                  formattedPriceInEUR,
                                  formattedPriceInRON,
                                  tvaRate
                                }),

                          value:
                            currency === PaymentCurrencyType.EUR
                              ? Number(priceWithTVA)
                              : PricingService.convertEURtoRON(
                                  Number(priceWithTVA),
                                  eurToRonRate
                                ).toNumber()
                        }

                        const depositAmount =
                          values[CreateProductPaymentLinkFormSection.Deposit]
                            .depositAmount
                        if (!depositAmount) return undefined

                        const isSmaller = new Decimal(depositAmount).lt(
                          min.value
                        )
                        if (isSmaller) return min.message

                        const isGreaterOrEqual = new Decimal(
                          PricingService.convertToCents(depositAmount)
                        ).gte(PricingService.convertToCents(max.value))
                        if (isGreaterOrEqual) return max.message
                      }}
                    >
                      {(depositAmount) =>
                        hasDeposit &&
                        depositAmount && (
                          <div className='grid grid-cols-[auto_1fr] gap-1 text-muted-foreground'>
                            <CircleAlert className='size-6 scale-75' />
                            <p className='text-sm font-normal'>
                              {depositAmount}
                            </p>
                          </div>
                        )
                      }
                    </form.Subscribe>
                  </FieldGroup>

                  <form.AppField
                    name={`${CreateProductPaymentLinkFormSection.Deposit}.firstPaymentDateAfterDepositOptionId`}
                    validators={{
                      onSubmit: !isFieldDisabled
                        ? z.string().nonempty()
                        : undefined
                    }}
                  >
                    {(field) => {
                      const daysCount =
                        firstPaymentDateAfterDepositOptions.find(
                          (option) => option.id === field.state.value
                        )?.value ?? '0'

                      return (
                        <FieldGroup>
                          <field.Select
                            icon={isFieldDisabled ? undefined : Calendar1}
                            isDisabled={isFieldDisabled}
                            isRequired={!isFieldDisabled}
                            label={t(
                              'fields.firstPaymentDateAfterDepositOptionId.placeholder'
                            )}
                            options={firstPaymentDateAfterDepositOptions.map(
                              (option) => ({
                                ...option,
                                label: option.value.toString(),
                                value: option.value.toString()
                              })
                            )}
                            placeholder={
                              isFieldDisabled
                                ? undefined
                                : t(
                                    'fields.firstPaymentDateAfterDepositOptionId.placeholder'
                                  )
                            }
                            renderItem={({ value }) => (
                              <p className='font-medium'>
                                {t.rich(
                                  'fields.firstPaymentDateAfterDepositOptionId.value',
                                  {
                                    daysCount: value
                                  }
                                )}
                              </p>
                            )}
                            valueKey='id'
                          />
                          <FieldContent
                            className={cn('text-muted-foreground', {
                              'opacity-50': isFieldDisabled
                            })}
                          >
                            <div className='grid grid-cols-[auto_1fr] gap-1'>
                              <Dot className='size-6' />
                              <FieldDescription>
                                {t.rich(
                                  `fields.firstPaymentDateAfterDepositOptionId.info.${PaymentMethodType.Card}`,
                                  {
                                    bold: (chunks) => (
                                      <span className='font-medium'>
                                        {chunks}
                                      </span>
                                    ),
                                    daysCount
                                  }
                                )}
                              </FieldDescription>
                            </div>

                            <div className='grid grid-cols-[auto_1fr] gap-1'>
                              <Dot className='size-6' />
                              <FieldDescription>
                                {t.rich(
                                  `fields.firstPaymentDateAfterDepositOptionId.info.${PaymentMethodType.BankTransfer}`,
                                  {
                                    bold: (chunks) => (
                                      <span className='font-medium'>
                                        {chunks}
                                      </span>
                                    ),
                                    daysCount
                                  }
                                )}
                              </FieldDescription>
                            </div>
                          </FieldContent>
                        </FieldGroup>
                      )
                    }}
                  </form.AppField>
                </FieldGroup>
              )
            }}
          </form.Subscribe>

          <FieldContent className='text-muted-foreground gap-7'>
            <div className='grid grid-cols-[auto_1fr] gap-1'>
              <Dot className='size-6' />
              <FieldDescription>
                {t.rich(`info.notice.${currency}`, {
                  bold: (chunks) => (
                    <span className='font-medium'>{chunks}</span>
                  ),
                  eurToRonRate,
                  formattedMinDepositAmountEUR,
                  formattedMinDepositAmountRON
                })}
              </FieldDescription>
            </div>

            <div className='grid grid-cols-[auto_1fr] gap-1'>
              <FieldDescription>
                {t.rich('info.warning', {
                  bold: (chunks) => (
                    <span className='font-medium'>{chunks}</span>
                  ),
                  formattedMinDepositAmountEUR,
                  formattedMinDepositAmountRON
                })}
              </FieldDescription>
            </div>
          </FieldContent>
        </FieldGroup>
      </FieldSet>
    )
  }
})
