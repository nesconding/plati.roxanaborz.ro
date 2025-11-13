'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { useTRPC } from '~/client/trpc/react'

export const VerifyDetailsSection = withForm({
  defaultValues,
  props: {
    paymentLinkId: ''
  },
  render: function Render(props) {
    const trpc = useTRPC()
    const findOnePaymentLinkByIdQuery = useQuery(
      trpc.public.paymentLinks.findOneById.queryOptions({
        id: props.paymentLinkId
      })
    )
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.Confirmation}.forms.verify-details`
    )

    const paymentLink = findOnePaymentLinkByIdQuery.data

    if (!paymentLink) return null

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>
        <FieldDescription>{t('description')}</FieldDescription>

        <FieldGroup>
          <Field>
            <div>Verify details</div>
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
