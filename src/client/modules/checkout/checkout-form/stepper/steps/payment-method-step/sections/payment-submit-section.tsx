'use client'

import { PaymentElement } from '@stripe/react-stripe-js'
import { Landmark } from 'lucide-react'
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
    const isBankTransferPayment =
      paymentLink.paymentMethodType === PaymentMethodType.BankTransfer

    return (
      <FieldSet>
        <FieldLegend>{t('legend')}</FieldLegend>

        <FieldGroup>
          <Field>
            {isTbiPayment ? (
              <div className='rounded-lg border bg-card p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='font-semibold text-lg'>TBI Bank</div>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t('tbiDescription')}
                </p>
              </div>
            ) : isBankTransferPayment ? (
              <div className='rounded-lg border bg-card p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-full bg-muted p-2'>
                    <Landmark className='size-5 text-muted-foreground' />
                  </div>
                  <div>
                    <div className='font-semibold text-lg'>
                      {t('bankTransferTitle')}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {t('bankTransferDescription')}
                    </p>
                  </div>
                </div>
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
