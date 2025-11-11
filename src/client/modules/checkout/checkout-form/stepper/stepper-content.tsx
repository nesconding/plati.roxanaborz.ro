'use client'

import type * as Stepperize from '@stepperize/react'
import { CreditCard, StepBack, StepForward } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { withForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { Spinner } from '~/client/components/ui/spinner'
import {
  CheckoutFormDefaultValues,
  CheckoutFormSection
} from '~/client/modules/checkout/checkout-form/schema'
import {
  Stepper,
  useStepper
} from '~/client/modules/checkout/checkout-form/stepper'
import { CheckoutFormStep } from '~/client/modules/checkout/checkout-form/stepper/config'
import { BillingInfoStep } from '~/client/modules/checkout/checkout-form/stepper/steps/billing-info-step'
import { ConfirmationStep } from '~/client/modules/checkout/checkout-form/stepper/steps/confirmation-step'
import { PaymentMethodStep } from '~/client/modules/checkout/checkout-form/stepper/steps/payment-method-step'

const STEPS_FORM_SECTIONS = {
  [CheckoutFormStep.BillingInfo]: [
    CheckoutFormSection.PersonalDetails,
    CheckoutFormSection.Address
  ]
} as const

export const StepperContent = withForm({
  defaultValues: CheckoutFormDefaultValues,
  props: {
    className: '' as string | undefined,
    isLoading: false
  },
  render: function Render(props) {
    const stepper = useStepper()
    const t = useTranslations(
      'modules.(app).checkout._components.checkout-form'
    )
    type Step = (typeof stepper.all)[number]

    function makeStepperContent(): Stepperize.Get.Switch<
      Step[],
      React.ReactNode
    > {
      const getStepperContent = (step: Step) => {
        switch (step.id) {
          case CheckoutFormStep.BillingInfo:
            return <BillingInfoStep {...props} />

          case CheckoutFormStep.PaymentMethod:
            return <PaymentMethodStep {...props} />

          case CheckoutFormStep.Confirmation:
            return <ConfirmationStep {...props} />
        }
      }

      return Object.fromEntries(
        stepper.all.map((step) => [
          step.id,
          (step: Step) => (
            <Stepper.Panel className='min-h-120'>
              {getStepperContent(step)}
            </Stepper.Panel>
          )
        ])
      )
    }

    async function handleOnNext() {
      if (stepper.current.id === CheckoutFormStep.PaymentMethod) {
        return
      }

      if (stepper.current.id === CheckoutFormStep.BillingInfo) {
        const currentFormSections = STEPS_FORM_SECTIONS[stepper.current.id].map(
          (section) => {
            return [
              section,
              Object.keys(CheckoutFormDefaultValues[section])
            ] as const
          }
        )
        await Promise.all(
          currentFormSections.map(([section, keys]) =>
            keys.map((key) =>
              // biome-ignore lint/suspicious/noExplicitAny: <>
              props.form.validateField(`${section}.${key}` as any, 'submit')
            )
          )
        )

        const fieldsErrors = currentFormSections.flatMap(([section]) =>
          Object.keys(props.form.getAllErrors().fields).filter((key) =>
            key.includes(`${section}.`)
          )
        )
        if (Object.keys(fieldsErrors).length > 0) return
      }

      stepper.next()
    }

    const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault()
      props.form.handleSubmit()
    }

    return (
      <form
        className={props.className}
        id={props.form.formId}
        onSubmit={handleOnSubmit}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t(`steps.${stepper.current.id}.title`)}</CardTitle>
            <CardDescription className='text-wrap'>
              {t(`steps.${stepper.current.id}.description`)}
            </CardDescription>
          </CardHeader>

          <CardContent>{stepper.switch(makeStepperContent())}</CardContent>

          <Stepper.Controls asChild>
            <CardFooter>
              {!stepper.isLast && (
                <Button
                  disabled={stepper.isFirst || props.isLoading}
                  onClick={stepper.prev}
                  type='button'
                  variant='secondary'
                >
                  <StepBack />
                  {t('buttons.previous-step')}
                </Button>
              )}

              {!stepper.isLast && (
                <Button onClick={handleOnNext} type='button'>
                  {t('buttons.next-step')}
                  <StepForward />
                </Button>
              )}

              {stepper.isLast && (
                <Button
                  disabled={props.isLoading}
                  form={props.form.formId}
                  type='submit'
                >
                  {props.isLoading ? <Spinner /> : <CreditCard />}
                  {props.isLoading
                    ? t('buttons.submit.loading')
                    : t('buttons.submit.default')}
                </Button>
              )}
            </CardFooter>
          </Stepper.Controls>
        </Card>
      </form>
    )
  }
})
