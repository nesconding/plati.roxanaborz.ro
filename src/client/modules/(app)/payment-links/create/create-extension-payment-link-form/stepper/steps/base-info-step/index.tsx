'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { ParticipantsFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/base-info-step/sections/participants-form-section'
import { ProductFormSection } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/base-info-step/sections/product-form-section'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateProductPaymentLinkFormDefaultValues as defaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]
type Meeting = TRPCRouterOutput['protected']['meetings']['findAll'][number]
type Product = TRPCRouterOutput['protected']['products']['findAll'][number]

export const BaseInfoStep = withForm({
  defaultValues,
  props: {
    contracts: [] as Contract[],
    meetings: [] as Meeting[],
    products: [] as Product[]
  },
  render: function Render(props) {
    return (
      <FieldGroup>
        <ParticipantsFormSection {...props} />
        <FieldSeparator />
        <ProductFormSection {...props} />
      </FieldGroup>
    )
  }
})
