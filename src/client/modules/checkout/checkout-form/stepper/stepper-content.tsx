'use client'

import type * as Stepperize from '@stepperize/react'
import {
  CreditCard,
  FileSignature,
  StepBack,
  StepForward,
  View
} from 'lucide-react'
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
import { useCheckout } from '~/client/modules/checkout/checkout-form/context'
import {
  BillingType,
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
import { ContractSigningStep } from '~/client/modules/checkout/checkout-form/stepper/steps/contract-signing-step'
import { PaymentMethodStep } from '~/client/modules/checkout/checkout-form/stepper/steps/payment-method-step'

// Map form sections to validate for each step
const STEPS_FORM_SECTIONS = {
  [CheckoutFormStep.BillingInfo]: [CheckoutFormSection.BillingData],
  [CheckoutFormStep.ContractSigning]: [CheckoutFormSection.ContractConsent]
} as const

export const StepperContent = withForm({
  defaultValues: CheckoutFormDefaultValues,
  props: {
    className: '' as string | undefined,
    isLoading: false,
    paymentLinkId: ''
  },
  render: function Render(props) {
    const stepper = useStepper()
    const { isExtension, hasContract } = useCheckout()
    const t = useTranslations(
      'modules.(app).checkout._components.checkout-form'
    )
    type Step = (typeof stepper.all)[number]

    // Determine if we should show the contract signing step
    const shouldShowContractStep = !isExtension && hasContract

    function makeStepperContent(): Stepperize.Get.Switch<
      Step[],
      React.ReactNode
    > {
      const getStepperContent = (step: Step) => {
        switch (step.id) {
          case CheckoutFormStep.BillingInfo:
            return <BillingInfoStep {...props} />

          case CheckoutFormStep.Confirmation:
            return <ConfirmationStep {...props} />

          case CheckoutFormStep.ContractSigning:
            return <ContractSigningStep {...props} />

          case CheckoutFormStep.PaymentMethod:
            return <PaymentMethodStep {...props} />
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

    async function validateCurrentStep() {
      // Get form sections to validate for current step
      const sectionsToValidate = STEPS_FORM_SECTIONS[
        stepper.current.id as keyof typeof STEPS_FORM_SECTIONS
      ]

      if (!sectionsToValidate) return true

      // Validate each section and its nested fields
      for (const section of sectionsToValidate) {
        if (section === CheckoutFormSection.BillingData) {
          // Handle discriminated union: validate fields based on current billing type
          const currentValues = props.form.getFieldValue(section)
          const billingType = currentValues.type

          // Define field paths for PERSON billing type
          const personFieldPaths = [
            'name',
            'surname',
            'email',
            'phoneNumber',
            'cnp',
            'address.street',
            'address.streetNumber',
            'address.building',
            'address.entrance',
            'address.floor',
            'address.apartment',
            'address.city',
            'address.county',
            'address.postalCode',
            'address.country'
          ]

          // Define field paths for COMPANY billing type
          const companyFieldPaths = [
            'name',
            'cui',
            'bank',
            'bankAccount',
            'registrationNumber',
            'representativeLegal',
            'socialHeadquarters.street',
            'socialHeadquarters.streetNumber',
            'socialHeadquarters.building',
            'socialHeadquarters.entrance',
            'socialHeadquarters.floor',
            'socialHeadquarters.apartment',
            'socialHeadquarters.city',
            'socialHeadquarters.county',
            'socialHeadquarters.postalCode',
            'socialHeadquarters.country'
          ]

          const fieldsToValidate =
            billingType === BillingType.PERSON
              ? personFieldPaths
              : companyFieldPaths

          // Validate each nested field individually
          await Promise.all(
            fieldsToValidate.map((fieldPath) =>
              // biome-ignore lint/suspicious/noExplicitAny: form field path
              props.form.validateField(`${section}.${fieldPath}` as any, 'submit')
            )
          )
        } else {
          // For non-discriminated sections (like ContractConsent), validate all keys from default values
          const defaultValues = CheckoutFormDefaultValues[section]
          if (defaultValues && typeof defaultValues === 'object') {
            const keys = Object.keys(defaultValues)
            await Promise.all(
              keys.map((key) =>
                // biome-ignore lint/suspicious/noExplicitAny: form field path
                props.form.validateField(`${section}.${key}` as any, 'submit')
              )
            )
          }
        }
      }

      // Check for errors in any of the validated sections
      const allErrors = props.form.getAllErrors()
      const hasErrors = sectionsToValidate.some((section) =>
        Object.keys(allErrors.fields).some(
          (key) => key.startsWith(`${section}.`) || key === section
        )
      )

      return !hasErrors
    }

    async function handleOnNext() {
      if (stepper.current.id === CheckoutFormStep.PaymentMethod) {
        return
      }

      // Validate current step before proceeding
      if (stepper.current.id in STEPS_FORM_SECTIONS) {
        const isValid = await validateCurrentStep()
        if (!isValid) return
      }

      // Skip contract signing step for extensions or if no contract
      if (
        stepper.current.id === CheckoutFormStep.Confirmation &&
        !shouldShowContractStep
      ) {
        // Skip to payment method (next after contract signing)
        stepper.goTo(CheckoutFormStep.PaymentMethod)
        return
      }

      stepper.next()
    }

    function handleOnPrev() {
      // Skip contract signing step when going back for extensions
      if (
        stepper.current.id === CheckoutFormStep.PaymentMethod &&
        !shouldShowContractStep
      ) {
        stepper.goTo(CheckoutFormStep.Confirmation)
        return
      }

      stepper.prev()
    }

    const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault()
      props.form.handleSubmit()
    }

    // Check if we're on the last step (accounting for skipped contract step)
    const isLastStep = shouldShowContractStep
      ? stepper.isLast
      : stepper.current.id === CheckoutFormStep.PaymentMethod

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
              <Button
                disabled={stepper.isFirst || props.isLoading}
                onClick={handleOnPrev}
                type='button'
                variant='secondary'
              >
                <StepBack />
                {t('buttons.previous-step')}
              </Button>

              {!isLastStep && (
                <Button onClick={handleOnNext} type='button'>
                  {t('buttons.next-step')}
                  <StepForward />
                </Button>
              )}

              {isLastStep && (
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
