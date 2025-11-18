'use client'

import { CheckCircle, CreditCard, MousePointerClick, View } from 'lucide-react'
import { cn } from '~/client/lib/utils'
import {
  Stepper,
  useStepper
} from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'

const STEPS_ICONS = {
  [CreateExtensionPaymentLinkFormStep.BaseInfo]: <MousePointerClick />,
  [CreateExtensionPaymentLinkFormStep.PaymentInfo]: <CreditCard />,
  [CreateExtensionPaymentLinkFormStep.Confirmation]: <View />,
  [CreateExtensionPaymentLinkFormStep.Success]: <CheckCircle />
} as const

export function StepperNavigation() {
  const stepper = useStepper()

  const currentIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current.id
  )
  const visibleSteps =
    currentIndex === 0
      ? stepper.all.slice(0, 3)
      : currentIndex === stepper.all.length - 1
        ? stepper.all.slice(-3)
        : stepper.all.slice(currentIndex - 1, currentIndex + 2)

  return (
    <Stepper.Navigation>
      {visibleSteps.map((step, index) => (
        <Stepper.Step
          className={cn('pointer-events-none', {
            'col-start-1': index === 0,
            'col-start-2': index === 1,
            'col-start-3': index === 2
          })}
          icon={STEPS_ICONS[step.id]}
          key={step.id}
          of={step.id}
          withSeparator={index !== 2}
        />
      ))}
    </Stepper.Navigation>
  )
}
