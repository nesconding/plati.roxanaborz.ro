'use client'

import type * as Stepperize from '@stepperize/react'
import { StepBack, StepForward, Wand2 } from 'lucide-react'
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
import { cn } from '~/client/lib/utils'
import {
  Stepper,
  useStepper
} from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper'
import { CreateExtensionPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/config'
import { BaseInfoStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/base-info-step'
import { ConfirmationStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/confirmation-step'
import { PaymentInfoStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/payment-info-step'
import { SuccessStep } from '~/client/modules/(app)/payment-links/create/create-extension-payment-link-form/stepper/steps/success-step'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateExtensionPaymentLinkFormDefaultValues } from '~/shared/create-extension-payment-link-form/create-extension-payment-link-form-schema'
import { CreateExtensionPaymentLinkFormSection } from '~/shared/create-extension-payment-link-form/enums/create-extension-payment-link-form-sections'

const STEPS_FORM_SECTIONS = {
  [CreateExtensionPaymentLinkFormStep.BaseInfo]: [
    CreateExtensionPaymentLinkFormSection.Extension
  ],
  [CreateExtensionPaymentLinkFormStep.PaymentInfo]: [
    CreateExtensionPaymentLinkFormSection.PaymentInfo,
    CreateExtensionPaymentLinkFormSection.Installments,
    CreateExtensionPaymentLinkFormSection.Deposit
  ]
} as const

// type Contracts = TRPCRouterOutput['protected']['contracts']['findAll']
type FirstPaymentDateAfterDepositOptions =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions']
type PaymentSettings =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings']
type Products = TRPCRouterOutput['protected']['products']['findAll']
type Memberships = TRPCRouterOutput['protected']['memberships']['findAll']

export const StepperContent = withForm({
  defaultValues: CreateExtensionPaymentLinkFormDefaultValues,
  props: {
    className: '',
    // contracts: [] as Contracts,
    // createOnePaymentLinkResponse: undefined as CreateOnePaymentLink | undefined,
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOptions,
    isLoading: false,
    memberships: [] as Memberships,
    onReset: undefined as (() => void) | undefined,
    paymentSettings: [] as PaymentSettings,
    products: [] as Products
  },
  render: function Render(props) {
    const stepper = useStepper()
    const t = useTranslations(
      'modules.(app).payment-links._components.create-extension-payment-link-form'
    )
    type Step = (typeof stepper.all)[number]

    function makeStepperContent(): Stepperize.Get.Switch<
      Step[],
      React.ReactNode
    > {
      const getStepperContent = (step: Step) => {
        switch (step.id) {
          case CreateExtensionPaymentLinkFormStep.BaseInfo:
            return <BaseInfoStep {...props} />

          case CreateExtensionPaymentLinkFormStep.PaymentInfo:
            // return <PaymentInfoStep {...props} />
            return <div>PaymentInfoStep</div>

          case CreateExtensionPaymentLinkFormStep.Confirmation:
            // return <ConfirmationStep {...props} />
            return <div>ConfirmationStep</div>

          case CreateExtensionPaymentLinkFormStep.Success:
            // return <SuccessStep {...props} />
            return <div>SuccessStep</div>
        }
      }

      return Object.fromEntries(
        stepper.all.map((step) => [
          step.id,
          (step: Step) => (
            <Stepper.Panel className='min-h-120 w-full'>
              {getStepperContent(step)}
            </Stepper.Panel>
          )
        ])
      )
    }

    function handleOnPrevious() {
      stepper.prev()

      if (
        stepper.current.id ===
          CreateExtensionPaymentLinkFormStep.Confirmation ||
        stepper.current.id === CreateExtensionPaymentLinkFormStep.Success
      ) {
        return
      }

      const currentFormSections = STEPS_FORM_SECTIONS[stepper.current.id].map(
        (section) => {
          return [
            section,
            Object.keys(CreateExtensionPaymentLinkFormDefaultValues[section])
          ] as const
        }
      )
      for (const [section, keys] of currentFormSections) {
        for (const key of keys) {
          // biome-ignore lint/suspicious/noExplicitAny: <>
          props.form.resetField(`${section}.${key}` as any)
        }
      }
    }

    async function handleOnNext() {
      if (
        stepper.current.id ===
          CreateExtensionPaymentLinkFormStep.Confirmation ||
        stepper.current.id === CreateExtensionPaymentLinkFormStep.Success
      ) {
        return
      }

      const currentFormSections = STEPS_FORM_SECTIONS[stepper.current.id].map(
        (section) => {
          return [
            section,
            Object.keys(CreateExtensionPaymentLinkFormDefaultValues[section])
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
        <Card
          className={cn({
            'gap-0 w-full h-[calc(100vh-var(--header-height)-(--spacing(4))-(--spacing(4))-(--spacing(9))-(--spacing(4)))]':
              stepper.current.id ===
              CreateExtensionPaymentLinkFormStep.Confirmation
          })}
        >
          <CardHeader
            className={cn({
              'pb-7 border-b':
                stepper.current.id ===
                CreateExtensionPaymentLinkFormStep.Confirmation
            })}
          >
            <CardTitle>{t(`steps.${stepper.current.id}.title`)}</CardTitle>
            <CardDescription className='text-wrap line-clamp-2 h-10'>
              {t(`steps.${stepper.current.id}.description`)}
            </CardDescription>
          </CardHeader>

          <CardContent
            className={cn('w-full h-full', {
              'p-0':
                stepper.current.id ===
                CreateExtensionPaymentLinkFormStep.Confirmation
            })}
          >
            {stepper.switch(makeStepperContent())}
          </CardContent>

          <Stepper.Controls asChild>
            <CardFooter
              className={cn('flex-col sm:flex-row', {
                'pt-7 border-t':
                  stepper.current.id ===
                  CreateExtensionPaymentLinkFormStep.Confirmation
              })}
            >
              {!stepper.isLast && (
                <Button
                  className='w-full sm:w-fit'
                  disabled={stepper.isFirst || props.isLoading}
                  onClick={handleOnPrevious}
                  type='button'
                  variant='secondary'
                >
                  <StepBack />
                  {t('buttons.previous-step')}
                </Button>
              )}

              {stepper.current.id !==
                CreateExtensionPaymentLinkFormStep.Confirmation &&
                !stepper.isLast && (
                  <Button
                    className='w-full sm:w-fit'
                    onClick={handleOnNext}
                    type='button'
                  >
                    {t('buttons.next-step')}
                    <StepForward />
                  </Button>
                )}

              {stepper.current.id ===
                CreateExtensionPaymentLinkFormStep.Confirmation && (
                <Button
                  className='w-full sm:w-fit'
                  disabled={props.isLoading}
                  form={props.form.formId}
                  type='submit'
                >
                  {props.isLoading ? <Spinner /> : <Wand2 />}
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
