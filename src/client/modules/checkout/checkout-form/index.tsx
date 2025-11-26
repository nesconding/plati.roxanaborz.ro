'use client'

import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { BookUser, CreditCard, FileSignature, View } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef } from 'react'

import { useAppForm } from '~/client/components/form/config'
import {
  CheckoutProvider,
  type PaymentLink,
  useCheckout
} from '~/client/modules/checkout/checkout-form/context'
import {
  type BillingDataFormValues,
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
import { useTRPC } from '~/client/trpc/react'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

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

/**
 * Stripe payment handler component that uses Stripe hooks.
 * Only mounted for Stripe payments (not TBI) to avoid the "no Elements context" error.
 */
interface StripePaymentHandlerRef {
  submit: (
    billingData: BillingDataFormValues,
    paymentLinkId: string
  ) => Promise<void>
}

const StripePaymentHandler = forwardRef<StripePaymentHandlerRef>(
  function StripePaymentHandler(_props, ref) {
    const elements = useElements()
    const stripe = useStripe()

    useImperativeHandle(ref, () => ({
      submit: async (
        billingData: BillingDataFormValues,
        paymentLinkId: string
      ) => {
        if (!elements || !stripe) return

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
            return_url: `${window.location.origin}/checkout/${paymentLinkId}/callback`
          },
          elements
        })
      }
    }))

    return null
  }
)

function CheckoutFormInner({ paymentLink }: CheckoutFormProps) {
  const stepper = useStepper()
  const { isExtension, hasContract } = useCheckout()
  const trpc = useTRPC()

  const isTbiPayment = paymentLink.paymentMethodType === PaymentMethodType.TBI

  // Ref for Stripe payment handler (only used for Stripe payments)
  const stripeHandlerRef = useRef<StripePaymentHandlerRef>(null)

  // TBI payment mutation
  const tbiMutation = useMutation(
    trpc.public.paymentLinks.initiateTbiPayment.mutationOptions()
  )

  // Determine if we should show the contract signing step
  const shouldShowContractStep = !isExtension && hasContract

  // Filter steps based on whether contract signing should be shown
  const visibleSteps = shouldShowContractStep
    ? stepper.all
    : stepper.all.filter((step) => step.id !== CheckoutFormStep.ContractSigning)

  const form = useAppForm({
    defaultValues: getDefaultValues(paymentLink),
    onSubmit: async ({ value }) => {
      if (!paymentLink) return

      // Get billing data for metadata
      const billingData = getBillingData(value)

      // Handle TBI payments
      if (isTbiPayment) {
        // TBI only supports person billing
        if (billingData.type !== 'PERSON') {
          throw new Error('TBI payments only support person billing')
        }

        const result = await tbiMutation.mutateAsync({
          billingData,
          paymentLinkId: paymentLink.id
        })

        // Redirect to TBI's application page
        window.location.href = result.redirectUrl
        return
      }

      // Handle Stripe payments via the handler ref
      await stripeHandlerRef.current?.submit(billingData, paymentLink.id)
    },
    validators: {
      onSubmit: CheckoutFormSchema
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const isLoading = isSubmitting || tbiMutation.isPending

  return (
    <div className='flex flex-col gap-4 w-full px-4 pb-4'>
      {/* Only render Stripe handler for Stripe payments */}
      {!isTbiPayment && <StripePaymentHandler ref={stripeHandlerRef} />}

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
