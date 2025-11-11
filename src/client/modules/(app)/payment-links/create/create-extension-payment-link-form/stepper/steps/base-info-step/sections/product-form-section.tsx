'use client'

import {
  PackageCheck,
  PackageOpen,
  PackageSearch,
  ScrollText
} from 'lucide-react'
import { useTranslations } from 'next-intl'
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
import { PaymentProductType } from '~/shared/enums/payment-product-type'

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]
type Product = TRPCRouterOutput['protected']['products']['findAll'][number]

export const ProductFormSection = withForm({
  defaultValues,
  props: {
    contracts: [] as Contract[],
    products: [] as Product[]
  },
  render: function Render({ contracts, form, products }) {
    const t = useTranslations(
      `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Product}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          {/* <FieldGroup className='sm:flex-row sm:items-start flex-wrap'> */}
          <FieldGroup className='grid grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 '>
            <form.AppField
              name={`${CreateProductPaymentLinkFormSection.Product}.productId`}
            >
              {(field) => {
                function onValueChange(value: string) {
                  const product = products.find(
                    (product) => product.id === value
                  )

                  if (!product?.extensions || product.extensions.length === 0) {
                    form.setFieldValue(
                      `${CreateProductPaymentLinkFormSection.Product}.productType`,
                      PaymentProductType.Product
                    )
                  }

                  form.setFieldValue(
                    `${CreateProductPaymentLinkFormSection.Product}.extensionId`,
                    ''
                  )

                  field.handleChange(value)
                }

                return (
                  <field.Select
                    icon={PackageSearch}
                    isRequired
                    label={t('fields.productId.title')}
                    onValueChange={onValueChange}
                    options={products}
                    placeholder={t('fields.productId.placeholder')}
                    renderItem={(product) => {
                      const formattedPrice = PricingService.formatPrice(
                        product.price,
                        PaymentCurrencyType.EUR
                      )
                      const name = product.name

                      return (
                        <div className='flex justify-between  gap-2 w-full font-medium items-center'>
                          <p>{name}</p>
                          <p className='text-muted-foreground max-sm:hidden'>
                            {t('fields.productId.item.formattedPrice', {
                              formattedPrice
                            })}
                          </p>
                        </div>
                      )
                    }}
                    valueKey='id'
                  />
                )
              }}
            </form.AppField>

            <form.AppField
              name={`${CreateProductPaymentLinkFormSection.Product}.contractId`}
            >
              {(field) => (
                <field.Select
                  icon={ScrollText}
                  isRequired
                  label={t('fields.contractId.title')}
                  options={contracts}
                  placeholder={t('fields.contractId.placeholder')}
                  renderItem={(contract) => (
                    <p className='font-medium'>{contract.name}</p>
                  )}
                  valueKey='id'
                />
              )}
            </form.AppField>
          </FieldGroup>

          <FieldGroup className='sm:flex-row sm:items-start'>
            <form.Subscribe
              selector={({
                values: {
                  [CreateProductPaymentLinkFormSection.Product]: { productId }
                }
              }) => {
                const product = products.find(
                  (product) => product.id === productId
                )
                return !product?.extensions || product?.extensions.length === 0
              }}
            >
              {(isDisabled) => (
                <form.AppField
                  name={`${CreateProductPaymentLinkFormSection.Product}.productType`}
                >
                  {(field) => {
                    function onValueChange(value: PaymentProductType) {
                      if (value === PaymentProductType.Product) {
                        form.setFieldValue(
                          `${CreateProductPaymentLinkFormSection.Product}.extensionId`,
                          ''
                        )
                      }

                      field.handleChange(value)
                    }
                    return (
                      <field.Select
                        className='col-span-1'
                        icon={PackageCheck}
                        isDisabled={isDisabled}
                        isRequired
                        label={t('fields.productType.title')}
                        onValueChange={onValueChange}
                        options={Object.values(PaymentProductType).map(
                          (value: PaymentProductType) => ({
                            value
                          })
                        )}
                        renderItem={({ value }) =>
                          t(`fields.productType.values.${value}`)
                        }
                        valueKey='value'
                      />
                    )
                  }}
                </form.AppField>
              )}
            </form.Subscribe>

            <form.Subscribe
              selector={({
                values: {
                  [CreateProductPaymentLinkFormSection.Product]: {
                    productId,
                    productType
                  }
                }
              }) => {
                const product = products.find(
                  (product) => product.id === productId
                )
                const extensions = product?.extensions ?? []
                return {
                  extensions,
                  isDisabled: productType !== PaymentProductType.Extension
                }
              }}
            >
              {({ extensions, isDisabled }) => (
                <form.AppField
                  name={`${CreateProductPaymentLinkFormSection.Product}.extensionId`}
                  validators={{
                    onSubmit: !isDisabled ? z.string().nonempty() : undefined
                  }}
                >
                  {(field) => {
                    return (
                      <field.Select
                        icon={isDisabled ? undefined : PackageOpen}
                        isDisabled={isDisabled}
                        label={t('fields.extensionId.title')}
                        options={extensions}
                        placeholder={
                          isDisabled
                            ? undefined
                            : t('fields.extensionId.placeholder')
                        }
                        renderItem={(extension) => {
                          const extensionMonths = extension.extensionMonths
                          const formattedPrice = PricingService.formatPrice(
                            extension.price,
                            PaymentCurrencyType.EUR
                          )

                          return (
                            <div className='flex justify-between gap-2 w-full font-medium items-center'>
                              <p>
                                {t('fields.extensionId.item.extensionMonths', {
                                  extensionMonths
                                })}
                              </p>
                              <p className='text-muted-foreground max-sm:hidden'>
                                {t('fields.productId.item.formattedPrice', {
                                  formattedPrice
                                })}
                              </p>
                            </div>
                          )
                        }}
                        valueKey='id'
                      />
                    )
                  }}
                </form.AppField>
              )}
            </form.Subscribe>
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    )
  }
})
