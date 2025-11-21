'use client'

import { withForm } from '~/client/components/form/config'
import { FieldGroup, FieldSeparator } from '~/client/components/ui/field'
import { ExtensionFormSection } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/base-info-step/sections/extension-form-section'
import { ParticipantsFormSection } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/base-info-step/sections/participants-form-section'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'

type Memberships = TRPCRouterOutput['protected']['memberships']['findAll']
type Products = TRPCRouterOutput['protected']['products']['findAll']

export const BaseInfoStep = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    memberships: [] as Memberships,
    products: [] as Products
  },
  render: function Render(props) {
    return (
      <FieldGroup>
        <ParticipantsFormSection {...props} />
        <FieldSeparator />
        <ExtensionFormSection {...props} />
      </FieldGroup>
    )
  }
})
