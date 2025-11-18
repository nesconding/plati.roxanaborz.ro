'use client'

import { PackageSearch, ScrollText } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
      `modules.(app).payment-links._components.create-product-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Product}`
    )

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <form.AppField
            name={`${CreateProductPaymentLinkFormSection.Product}.productId`}
          >
            {(field) => (
              <field.Select
                icon={PackageSearch}
                isRequired
                label={t('fields.productId.title')}
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
            )}
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
      </FieldSet>
    )
  }
})
