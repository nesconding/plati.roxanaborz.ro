'use client'

import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useStore } from '@tanstack/react-form'
import { BookUser, CreditCard, View } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAppForm } from '~/client/components/form/config'
import {
  CheckoutFormDefaultValues,
  CheckoutFormSchema,
  CheckoutFormSection,
  type CheckoutFormValues
} from '~/client/modules/checkout/checkout-form/schema'
import {
  Stepper,
  useStepper
} from '~/client/modules/checkout/checkout-form/stepper'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { StepperContent } from '~/client/modules/checkout/checkout-form/stepper/stepper-content'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

type PaymentLink = NonNullable<
  TRPCRouterOutput['public']['paymentLinks']['findOneById']
>
interface CheckoutFormProps {
  paymentLink: PaymentLink
}

export function CheckoutForm(props: CheckoutFormProps) {
  return (
    <Stepper.Provider variant='horizontal'>
      <CheckoutFormInner {...props} />
    </Stepper.Provider>
  )
}

function getDefaultValues(paymentLink: PaymentLink): CheckoutFormValues {
  return {
    ...CheckoutFormDefaultValues,
    [CheckoutFormSection.PersonalDetails]: {
      ...CheckoutFormDefaultValues[CheckoutFormSection.PersonalDetails],
      email: paymentLink?.customerEmail ?? '',
      name: paymentLink?.customerName ?? ''
    }
  }
}

const STEPS_ICONS = {
  [CheckoutFormStep.BillingInfo]: <BookUser />,
  [CheckoutFormStep.Confirmation]: <View />,
  [CheckoutFormStep.PaymentMethod]: <CreditCard />
} as const

function CheckoutFormInner({ paymentLink }: CheckoutFormProps) {
  const t = useTranslations('modules.(app).checkout._components.checkout-form')
  const stepper = useStepper()
  const trpc = useTRPC()

  const elements = useElements()
  const stripe = useStripe()

  const form = useAppForm({
    defaultValues: getDefaultValues(paymentLink),
    onSubmit: async ({ value }) => {
      if (!elements || !stripe || !paymentLink) return

      await elements.submit()
      const res = await stripe.confirmPayment({
        confirmParams: {
          // payment_method_data: {
          //   billing_details: value
          // },
          return_url: `${window.location.origin}/checkout/${paymentLink.id}/callback`
        },
        elements
      })
      console.log(res)
    },
    validators: {
      onSubmit: CheckoutFormSchema
    }
  })

  const [isSubmitting] = useStore(
    form.store,
    (state) =>
      [state.isSubmitting, state.isPristine, state.isDefaultValue] as const
  )

  const isLoading = isSubmitting

  return (
    <div className='flex flex-col gap-4 w-full px-4'>
      <Stepper.Navigation>
        {stepper.all.map((step) => (
          <Stepper.Step
            icon={STEPS_ICONS[step.id]}
            key={step.id}
            of={step.id}
          />
        ))}
      </Stepper.Navigation>

      <StepperContent
        className='col-span-3'
        form={form}
        isLoading={isLoading}
      />
    </div>
  )
}
