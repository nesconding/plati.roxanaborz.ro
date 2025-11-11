'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAppForm } from '~/client/components/form/config'
import {
  Stepper,
  useStepper
} from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper'
import { CreateProductPaymentLinkFormStep } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/config'
import { StepperContent } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/stepper-content'
import { StepperNavigation } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form/stepper/stepper-navigation'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import {
  CreateProductPaymentLinkFormDefaultValues,
  CreateProductPaymentLinkFormSchema,
  type CreateProductPaymentLinkFormValues
} from '~/shared/create-product-payment-link-form/create-product-payment-link-form-schema'
import { CreateProductPaymentLinkFormSection } from '~/shared/create-product-payment-link-form/enums/create-product-payment-link-form-sections'

type CreateOnePaymentLink =
  TRPCRouterOutput['protected']['productPaymentLinks']['createOne']

export function CreateProductPaymentLinkForm() {
  return (
    <Stepper.Provider variant='horizontal'>
      <CreateProductPaymentLinkFormInner />
    </Stepper.Provider>
  )
}

function CreateProductPaymentLinkFormInner() {
  const t = useTranslations(
    'modules.(app).payment-links._components.create-payment-link-form'
  )
  const stepper = useStepper()
  const [createOnePaymentLinkResponse, setCreateOnePaymentLinkResponse] =
    useState<CreateOnePaymentLink>()
  const trpc = useTRPC()

  const findAllContracts = useQuery(
    trpc.protected.contracts.findAll.queryOptions()
  )
  const findAllFirstPaymentDateAfterDepositOptions = useQuery(
    trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
  )
  const getEURToRONRate = useQuery(
    trpc.protected.settings.getEURToRONRate.queryOptions()
  )
  const findAllMeetings = useQuery(
    trpc.protected.meetings.findAll.queryOptions()
  )
  const findAllPaymentSettings = useQuery(
    trpc.protected.settings.findAllPaymentSettings.queryOptions()
  )
  const findAllProducts = useQuery(
    trpc.protected.products.findAll.queryOptions()
  )

  const createPaymentLink = useMutation(
    trpc.protected.productPaymentLinks.createOne.mutationOptions()
  )

  const defaultValues: CreateProductPaymentLinkFormValues = {
    ...CreateProductPaymentLinkFormDefaultValues,
    [CreateProductPaymentLinkFormSection.PaymentInfo]: {
      ...CreateProductPaymentLinkFormDefaultValues[
        CreateProductPaymentLinkFormSection.PaymentInfo
      ],
      paymentSettingId:
        findAllPaymentSettings.data?.find(
          (paymentSetting) =>
            paymentSetting.label.toLowerCase() === 'românia' ||
            paymentSetting.label.toLowerCase() === 'romania'
        )?.id ??
        findAllPaymentSettings.data?.[0]?.id ??
        ''
    }
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await createPaymentLink.mutateAsync(value, {
        onError: (error) => {
          toast.error(t('response.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('response.error.description')
          })
        },
        onSuccess: (data) => {
          toast.success(t('response.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('response.success.description')
          })
          setCreateOnePaymentLinkResponse(data)
          stepper.goTo(CreateProductPaymentLinkFormStep.Success)
          formApi.reset()
          createPaymentLink.reset()
        }
      })
    },
    validators: { onSubmit: CreateProductPaymentLinkFormSchema }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  if (
    !findAllContracts.data ||
    !findAllFirstPaymentDateAfterDepositOptions.data ||
    !getEURToRONRate.data ||
    !findAllMeetings.data ||
    !findAllPaymentSettings.data ||
    !findAllProducts.data
  ) {
    return null
  }

  const isLoading = createPaymentLink.isPending || isSubmitting

  function handleOnReset() {
    stepper.reset()
    form.reset()
    createPaymentLink.reset()
    setCreateOnePaymentLinkResponse(undefined)
  }

  return (
    <div className='flex flex-col gap-4 p-4'>
      <StepperNavigation />

      <StepperContent
        className='col-span-3'
        contracts={findAllContracts.data}
        createOnePaymentLinkResponse={createOnePaymentLinkResponse}
        eurToRonRate={getEURToRONRate.data}
        firstPaymentDateAfterDepositOptions={
          findAllFirstPaymentDateAfterDepositOptions.data
        }
        form={form}
        isLoading={isLoading}
        meetings={findAllMeetings.data}
        onReset={handleOnReset}
        paymentSettings={findAllPaymentSettings.data}
        products={findAllProducts.data}
      />
    </div>
  )
}
