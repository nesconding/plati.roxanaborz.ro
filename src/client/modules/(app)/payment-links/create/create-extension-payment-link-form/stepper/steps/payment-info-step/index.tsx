'use client'

import { useStore } from '@tanstack/react-form'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import { DepositFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/deposit-form-section'
import { InstallmentsFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/installments-form-section'
import { PaymentInfoFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step/sections/payment-info-form-section'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateProductPaymentLinkFormDefaultValues as defaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]
type FirstPaymentDateAfterDepositOption =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions'][number]

export const PaymentInfoStep = withForm({
  defaultValues,
  props: {
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOption[],
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render(props) {
    // const t = useTranslations(
    //   `modules.(app).payment-links._components.create-payment-link-form.steps.${CreateProductPaymentLinkFormStep.BaseInfo}.forms.${CreateProductPaymentLinkFormSection.Product}.fields`
    // )

    const currentConfiguration = useStore(props.form.store, ({ values }) => {
      const productId =
        values[CreateProductPaymentLinkFormSection.Product].productId
      // const extensionId =
      //   values[CreateProductPaymentLinkFormSection.Product].extensionId

      const product = props.products.find((product) => product.id === productId)
      // const extension = product?.extensions.find(
      //   (extension) => extension.id === extensionId
      // )
      // const productType =
      //   values[CreateProductPaymentLinkFormSection.Product].productType

      const currentConfigurationChunks = [
        product?.name
        // t(`productType.values.${productType}`)
        // extension
        //   ? t('extensionId.item.extensionMonths', {
        //       extensionMonths: extension?.extensionMonths
        //     })
        //   : null
      ].filter(Boolean)

      const currentConfiguration = currentConfigurationChunks.map(
        (chunk, index) => (
          <Fragment key={chunk}>
            <span className='font-semibold'>
              {chunk}
              {index === currentConfigurationChunks.length - 1 && (
                <span className='font-normal'>.</span>
              )}
            </span>
            {index !== currentConfigurationChunks.length - 1 && (
              <ArrowRight className='size-3' />
            )}
          </Fragment>
        )
      )

      return currentConfiguration
    })

    return (
      <FieldGroup>
        <PaymentInfoFormSection {...props} />
        <FieldSeparator />
        <InstallmentsFormSection
          {...props}
          currentConfiguration={currentConfiguration}
        />
        <FieldSeparator />
        <DepositFormSection
          {...props}
          currentConfiguration={currentConfiguration}
        />
      </FieldGroup>
    )
  }
})
