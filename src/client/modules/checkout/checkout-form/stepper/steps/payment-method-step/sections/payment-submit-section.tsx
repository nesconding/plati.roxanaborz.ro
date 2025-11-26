'use client'

import { PaymentElement } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'
import { withForm } from '~/client/components/form/config'
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { useCheckout } from '~/client/modules/checkout/checkout-form/context'
import { CheckoutFormDefaultValues as defaultValues } from '~/client/modules/checkout/checkout-form/schema'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

export const PaymentSubmitSection = withForm({
  defaultValues,
  render: function Render() {
    const t = useTranslations(
      `modules.(app).checkout._components.checkout-form.steps.${CheckoutFormStep.PaymentMethod}.forms.payment-submit`
    )
    const { paymentLink } = useCheckout()
    const isTbiPayment = paymentLink.paymentMethodType === PaymentMethodType.TBI

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <Field>
            {isTbiPayment ? (
              <div className='p-4 border rounded-lg bg-muted/50'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='font-semibold text-lg'>TBI Bank</div>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t('tbiDescription')}
                </p>
              </div>
            ) : (
              <PaymentElement
                options={{ layout: 'tabs', terms: { card: 'never' } }}
              />
            )}
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  }
})
