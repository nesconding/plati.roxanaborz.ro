'use client'

import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useStore } from '@tanstack/react-form'
import { BookUser, CreditCard, FileSignature, View } from 'lucide-react'

import { useAppForm } from '~/client/components/form/config'
import {
  CheckoutProvider,
  type PaymentLink,
  useCheckout
} from '~/client/modules/checkout/checkout-form/context'
import {
  BillingType,
  CheckoutFormDefaultValues,
  CheckoutFormSchema,
  CheckoutFormSection,
  type CheckoutFormValues,
  getBillingData
} from '~/client/modules/checkout/checkout-form/schema'
import {
  Stepper,
  useStepper
} from '~/client/modules/checkout/checkout-form/stepper'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { StepperContent } from '~/client/modules/checkout/checkout-form/stepper/stepper-content'

interface CheckoutFormProps {
  paymentLink: PaymentLink
}

export function CheckoutForm(props: CheckoutFormProps) {
  return (
    <CheckoutProvider paymentLink={props.paymentLink}>
      <Stepper.Provider variant='horizontal'>
        <CheckoutFormInner {...props} />
      </Stepper.Provider>
    </CheckoutProvider>
  )
}

function getDefaultValues(paymentLink: PaymentLink): CheckoutFormValues {
  const billingDataDefaults =
    CheckoutFormDefaultValues[CheckoutFormSection.BillingData]

  // Since billingData is a discriminated union, we need to ensure it has the person type
  if (billingDataDefaults.type !== BillingType.PERSON) {
    throw new Error('Default billing data must be of type PERSON')
  }

  const fullname = paymentLink?.customerName ?? billingDataDefaults.name

  const surname = fullname.split(' ')[0] ?? ''
  const name = fullname.split(' ').slice(1).join(' ') ?? ''

  return {
    ...CheckoutFormDefaultValues,
    [CheckoutFormSection.BillingData]: {
      ...billingDataDefaults,
      email: paymentLink?.customerEmail ?? billingDataDefaults.email,
      name,
      surname
    }
  }
}

const STEPS_ICONS = {
  [CheckoutFormStep.BillingInfo]: <BookUser />,
  [CheckoutFormStep.Confirmation]: <View />,
  [CheckoutFormStep.ContractSigning]: <FileSignature />,
  [CheckoutFormStep.PaymentMethod]: <CreditCard />
} as const

function CheckoutFormInner({ paymentLink }: CheckoutFormProps) {
  const stepper = useStepper()
  const { isExtension, hasContract } = useCheckout()

  const elements = useElements()
  const stripe = useStripe()

  // Determine if we should show the contract signing step
  const shouldShowContractStep = !isExtension && hasContract

  // Filter steps based on whether contract signing should be shown
  const visibleSteps = shouldShowContractStep
    ? stepper.all
    : stepper.all.filter((step) => step.id !== CheckoutFormStep.ContractSigning)

  const form = useAppForm({
    defaultValues: getDefaultValues(paymentLink),
    onSubmit: async ({ value }) => {
      if (!elements || !stripe || !paymentLink) return

      // Get billing data for metadata
      const billingData = getBillingData(value)

      await elements.submit()
      await stripe.confirmPayment({
        confirmParams: {
          payment_method_data: {
            billing_details: {
              email:
                billingData.type === 'PERSON' ? billingData.email : undefined,
              name:
                billingData.type === 'PERSON'
                  ? `${billingData.surname} ${billingData.name}`
                  : billingData.name
            },
            metadata: {
              billingData: JSON.stringify(billingData)
            }
          },
          return_url: `${window.location.origin}/checkout/${paymentLink.id}/callback`
        },
        elements
      })
    },
    validators: {
      onSubmit: CheckoutFormSchema
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const isLoading = isSubmitting

  return (
    <div className='flex flex-col gap-4 w-full px-4 pb-4'>
      <Stepper.Navigation>
        {visibleSteps.map((step) => (
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
        paymentLinkId={paymentLink.id}
      />
    </div>
  )
}
