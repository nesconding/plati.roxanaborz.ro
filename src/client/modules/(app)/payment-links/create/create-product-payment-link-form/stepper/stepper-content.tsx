'use client'

import type * as Stepperize from '@stepperize/react'
import {
  CheckCircle,
  CreditCard,
  MousePointerClick,
  StepBack,
  StepForward,
  View,
  Wand2
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { withForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '~/client/components/ui/card'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import {
  Stepper,
  useStepper
} from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import { BaseInfoStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/base-info-step'
import { ConfirmationStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/confirmation-step'
import { PaymentInfoStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/payment-info-step'
import { SuccessStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/steps/success-step'
import type { TRPCRouterOutput } from '~/client/trpc/react'
import { CreateProductPaymentLinkFormDefaultValues } from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'

const STEPS_FORM_SECTIONS = {
  [CreateProductPaymentLinkFormStep.BaseInfo]: [
    CreateProductPaymentLinkFormSection.Participants,
    CreateProductPaymentLinkFormSection.Product
  ],
  [CreateProductPaymentLinkFormStep.PaymentInfo]: [
    CreateProductPaymentLinkFormSection.PaymentInfo,
    CreateProductPaymentLinkFormSection.Installments,
    CreateProductPaymentLinkFormSection.Deposit
  ]
} as const

const STEPS_ICONS = {
  [CreateProductPaymentLinkFormStep.BaseInfo]: <MousePointerClick />,
  [CreateProductPaymentLinkFormStep.PaymentInfo]: <CreditCard />,
  [CreateProductPaymentLinkFormStep.Confirmation]: <View />,
  [CreateProductPaymentLinkFormStep.Success]: <CheckCircle />
} as const

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]
type CreateOnePaymentLink =
  TRPCRouterOutput['protected']['productPaymentLinks']['createOne']
type FirstPaymentDateAfterDepositOption =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions'][number]
type ScheduledEvent =
  TRPCRouterOutput['protected']['scheduledEvents']['findAll'][number]
type PaymentSetting =
  TRPCRouterOutput['protected']['settings']['findAllPaymentSettings'][number]
type Product = TRPCRouterOutput['protected']['products']['findAll'][number]

export const StepperContent = withForm({
  defaultValues: CreateProductPaymentLinkFormDefaultValues,
  props: {
    className: '',
    contracts: [] as Contract[],
    createOnePaymentLinkResponse: undefined as CreateOnePaymentLink | undefined,
    eurToRonRate: '',
    firstPaymentDateAfterDepositOptions:
      [] as FirstPaymentDateAfterDepositOption[],
    isLoading: false,
    onReset: undefined as (() => void) | undefined,
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[],
    scheduledEvents: [] as ScheduledEvent[]
  },
  render: function Render(props) {
    const stepper = useStepper()
    const t = useTranslations(
      'modules.(app).payment-links._components.create-product-payment-link-form'
    )
    type Step = (typeof stepper.all)[number]

    function makeStepperContent(): Stepperize.Get.Switch<
      Step[],
      React.ReactNode
    > {
      const getStepperContent = (step: Step) => {
        switch (step.id) {
          case CreateProductPaymentLinkFormStep.BaseInfo:
            return <BaseInfoStep {...props} />

          case CreateProductPaymentLinkFormStep.PaymentInfo:
            return <PaymentInfoStep {...props} />

          case CreateProductPaymentLinkFormStep.Confirmation:
            return <ConfirmationStep {...props} />

          case CreateProductPaymentLinkFormStep.Success:
            return <SuccessStep {...props} />
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
        stepper.current.id === CreateProductPaymentLinkFormStep.Confirmation ||
        stepper.current.id === CreateProductPaymentLinkFormStep.Success
      ) {
        return
      }

      const currentFormSections = STEPS_FORM_SECTIONS[stepper.current.id].map(
        (section) => {
          return [
            section,
            Object.keys(CreateProductPaymentLinkFormDefaultValues[section])
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
        stepper.current.id === CreateProductPaymentLinkFormStep.Confirmation ||
        stepper.current.id === CreateProductPaymentLinkFormStep.Success
      ) {
        return
      }

      const currentFormSections = STEPS_FORM_SECTIONS[stepper.current.id].map(
        (section) => {
          return [
            section,
            Object.keys(CreateProductPaymentLinkFormDefaultValues[section])
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
      <form
        className={props.className}
        id={props.form.formId}
        onSubmit={handleOnSubmit}
      >
        <Card
          className={cn({
            'gap-0 w-full h-[calc(100vh-var(--header-height)-(--spacing(4))-(--spacing(4))-(--spacing(9))-(--spacing(4)))]':
              stepper.current.id ===
              CreateProductPaymentLinkFormStep.Confirmation
          })}
        >
          <CardHeader
            className={cn({
              'pb-7 border-b':
                stepper.current.id ===
                CreateProductPaymentLinkFormStep.Confirmation
            })}
          >
            {/* <CardTitle>{t(`steps.${stepper.current.id}.title`)}</CardTitle>
            <CardDescription className='text-wrap line-clamp-2 h-10'>
              {t(`steps.${stepper.current.id}.description`)}
            </CardDescription> */}

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
                  // title={t(`steps.${step.id}.title`)}
                  withSeparator={index !== 2}
                />
              ))}
            </Stepper.Navigation>
          </CardHeader>

          <CardContent
            className={cn('w-full h-full', {
              'p-0':
                stepper.current.id ===
                CreateProductPaymentLinkFormStep.Confirmation
            })}
          >
            {stepper.switch(makeStepperContent())}
          </CardContent>

          <Stepper.Controls asChild>
            <CardFooter
              className={cn('flex-col sm:flex-row', {
                'pt-7 border-t':
                  stepper.current.id ===
                  CreateProductPaymentLinkFormStep.Confirmation
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
                CreateProductPaymentLinkFormStep.Confirmation &&
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
                CreateProductPaymentLinkFormStep.Confirmation && (
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
