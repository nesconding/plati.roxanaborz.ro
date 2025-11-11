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

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]
type CreateOnePaymentLink =
  TRPCRouterOutput['protected']['productPaymentLinks']['createOne']
type FirstPaymentDateAfterDepositOption =
  TRPCRouterOutput['protected']['settings']['findAllFirstPaymentDateAfterDepositOptions'][number]
type Meeting = TRPCRouterOutput['protected']['meetings']['findAll'][number]
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
    meetings: [] as Meeting[],
    onReset: undefined as (() => void) | undefined,
    paymentSettings: [] as PaymentSetting[],
    products: [] as Product[]
  },
  render: function Render(props) {
    const stepper = useStepper()
    const t = useTranslations(
      'modules.(app).payment-links._components.create-payment-link-form'
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
            <Stepper.Panel className='min-h-120'>
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
                  <Button onClick={handleOnNext} type='button'>
                    {t('buttons.next-step')}
                    <StepForward />
                  </Button>
                )}

              {stepper.current.id ===
                CreateProductPaymentLinkFormStep.Confirmation && (
                <Button
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
