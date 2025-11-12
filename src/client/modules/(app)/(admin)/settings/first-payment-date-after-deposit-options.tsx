'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  ChartCandlestick,
  Currency,
  Landmark,
  Pen,
  Percent,
  Plus,
  Save,
  Trash
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { useAppForm } from '~/client/components/form/config'
import { RequiredMarker } from '~/client/components/form/fields/utils'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'

import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { FirstPaymentDateAfterDepositOptionsTableValidators } from '~/shared/validation/tables'
import { NumericString } from '~/shared/validation/utils'

const schema = z.object({
  data: FirstPaymentDateAfterDepositOptionsTableValidators.insert
    .extend({
      value: NumericString()
    })
    .array()
})

interface FirstPaymentDateAfterDepositOptionsProps {
  className?: string
}

export function FirstPaymentDateAfterDepositOptions({
  className
}: FirstPaymentDateAfterDepositOptionsProps) {
  const t = useTranslations(
    'modules.(app).(admin).settings.first-payment-date-after-deposit-options'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const findAllFirstPaymentDateAfterDepositOptions = useQuery(
    trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions(
      undefined,
      {
        initialData: []
      }
    )
  )

  const updateManyFirstPaymentDateAfterDepositOption = useMutation(
    trpc.admin.settings.updateManyFirstPaymentDateAfterDepositOption.mutationOptions()
  )

  const form = useAppForm({
    defaultValues: {
      data: findAllFirstPaymentDateAfterDepositOptions.data.map(
        ({ value, ...rest }) => ({ ...rest, value: value.toString() })
      ) as z.infer<typeof schema>['data']
    },
    onSubmit: async ({ value, formApi }) =>
      updateManyFirstPaymentDateAfterDepositOption.mutate(value.data, {
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
          console.error(error)
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryKey()
          })
          toast.success(t('response.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('response.success.description')
          })
          formApi.reset()
          updateManyFirstPaymentDateAfterDepositOption.reset()
        }
      }),
    validators: { onSubmit: schema }
  })

  const [isSubmitting, isDefaultValue] = useStore(form.store, (state) => [
    state.isSubmitting,
    state.isDefaultValue
  ])
  const isLoading =
    updateManyFirstPaymentDateAfterDepositOption.isPending || isSubmitting
  const canSubmit = !isDefaultValue && !isLoading

  function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className={className} id={form.formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
            <form.AppField mode='array' name='data'>
              {(array) =>
                array.state.value.map((item, index) => (
                  <Fragment key={`${item.id}-${index}`}>
                    <form.Field name={`data[${index}].value`}>
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        const isDisabled = isLoading

                        return (
                          <Field
                            aria-disabled={isDisabled}
                            data-disabled={isDisabled}
                            data-invalid={isInvalid}
                          >
                            <FieldLabel
                              className='gap-0.5'
                              htmlFor={field.name}
                            >
                              {t('item.label', { index: index + 1 })}
                            </FieldLabel>

                            <div className='flex gap-3'>
                              <InputGroup
                                aria-disabled={isDisabled}
                                aria-invalid={isInvalid}
                                className={cn({
                                  'cursor-not-allowed': isDisabled,
                                  'opacity-50': isDisabled
                                })}
                                data-disabled={isDisabled}
                              >
                                <InputGroupInput
                                  aria-disabled={isDisabled}
                                  aria-invalid={isInvalid}
                                  className='overflow-ellipsis'
                                  data-disabled={isDisabled}
                                  disabled={isDisabled}
                                  id={field.name}
                                  min={1}
                                  name={field.name}
                                  onBlur={field.handleBlur}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder={t('item.placeholder', { index })}
                                  step={1}
                                  type='number'
                                  value={field.state.value}
                                />

                                <InputGroupAddon align='inline-start'>
                                  <CalendarDays className='group-has-aria-invalid/input-group:text-destructive' />
                                </InputGroupAddon>
                              </InputGroup>

                              <Button
                                disabled={isLoading}
                                onClick={() => array.removeValue(index)}
                                size='icon'
                                type='button'
                                variant='destructive'
                              >
                                <Trash />
                              </Button>
                            </div>

                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    </form.Field>

                    {index < array.state.value.length - 1 && <FieldSeparator />}
                  </Fragment>
                ))
              }
            </form.AppField>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className='flex items-center justify-end gap-3 md:flex-row flex-col'>
        <Button
          className='w-full md:w-fit'
          disabled={isLoading}
          onClick={() => {
            form.getFieldInfo('data').instance?.pushValue({
              value: ''
            })
          }}
          type='button'
          variant='outline'
        >
          <Plus />
          {t('buttons.add')}
        </Button>

        <Button
          className='w-full md:w-fit'
          disabled={!canSubmit}
          form={form.formId}
          type='submit'
        >
          {isLoading ? <Spinner /> : <Save />}
          {isLoading
            ? t('buttons.submit.loading')
            : t('buttons.submit.default')}
        </Button>
      </CardFooter>
    </Card>
  )
}
