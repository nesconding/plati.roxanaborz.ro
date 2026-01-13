'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
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
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/client/components/ui/select'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentsSettingsTableValidators } from '~/shared/validation/tables'
import { NonNegativeNumericString } from '~/shared/validation/utils'

const schema = z.object({
  data: PaymentsSettingsTableValidators.insert
    .extend({
      currency: z.enum(PaymentCurrencyType),
      extraTaxRate: NonNegativeNumericString(),
      label: z.string().nonempty(),
      tvaRate: NonNegativeNumericString()
    })
    .array()
})

interface PaymentSettingsProps {
  className?: string
}

export function PaymentSettings({ className }: PaymentSettingsProps) {
  const t = useTranslations('modules.(app).(admin).settings.payment-settings')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const findAllPaymentSettings = useQuery(
    trpc.protected.settings.findAllPaymentSettings.queryOptions(undefined, {
      initialData: []
    })
  )
  const updateManyPaymentSettings = useMutation(
    trpc.admin.settings.updateManyPaymentSettings.mutationOptions()
  )

  const form = useAppForm({
    defaultValues: {
      data: findAllPaymentSettings.data as (typeof PaymentsSettingsTableValidators.$types.insert)[]
    },
    onSubmit: async ({ value, formApi }) =>
      updateManyPaymentSettings.mutate(value.data, {
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
            queryKey: trpc.protected.settings.findAllPaymentSettings.queryKey()
          })
          toast.success(t('response.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('response.success.description')
          })
          formApi.reset()
          updateManyPaymentSettings.reset()
        }
      }),
    validators: { onSubmit: schema }
  })

  const [isSubmitting, isDefaultValue] = useStore(form.store, (state) => [
    state.isSubmitting,
    state.isDefaultValue
  ])
  const isLoading = updateManyPaymentSettings.isPending || isSubmitting
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
                    <FieldSet>
                      <div className='flex items-center justify-between gap-2'>
                        <FieldLegend>
                          {t('form.item.legend', { index: index + 1 })}
                        </FieldLegend>

                        <Button
                          onClick={() => array.removeValue(index)}
                          size='icon-sm'
                          type='button'
                          variant='destructive'
                        >
                          <Trash />
                        </Button>
                      </div>

                      <FieldGroup className='md:grid md:grid-cols-[2fr_1fr_1fr_1fr] 2xl:grid-cols-[3fr_1fr_1fr_1fr] md:grid-rows-[auto_auto_auto] md:gap-3'>
                        <form.Field name={`data[${index}].label`}>
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            const isDisabled = isLoading

                            return (
                              <Field
                                aria-disabled={isDisabled}
                                className='md:grid md:grid-rows-subgrid md:col-span-1 md:row-span-3'
                                data-disabled={isDisabled}
                                data-invalid={isInvalid}
                              >
                                <FieldLabel
                                  className='gap-0.5'
                                  htmlFor={field.name}
                                >
                                  {t('form.fields.label.label')}
                                  <RequiredMarker />
                                </FieldLabel>

                                <FieldDescription
                                  className={cn({
                                    'opacity-50': isDisabled
                                  })}
                                >
                                  {t('form.fields.label.description')}
                                </FieldDescription>

                                <div className='flex flex-col gap-3'>
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
                                      name={field.name}
                                      onBlur={field.handleBlur}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder={t(
                                        'form.fields.label.placeholder'
                                      )}
                                      value={field.state.value}
                                    />

                                    <InputGroupAddon align='inline-start'>
                                      <Pen className='group-has-aria-invalid/input-group:text-destructive' />
                                    </InputGroupAddon>
                                  </InputGroup>

                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </div>
                              </Field>
                            )
                          }}
                        </form.Field>

                        <form.Field name={`data[${index}].currency`}>
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            const isDisabled = isLoading

                            return (
                              <Field
                                aria-disabled={isDisabled}
                                className='md:grid md:grid-rows-subgrid md:col-span-1 md:row-span-3 md:min-w-28'
                                data-disabled={isDisabled}
                                data-invalid={isInvalid}
                              >
                                <FieldLabel
                                  className='gap-0.5'
                                  htmlFor={field.name}
                                >
                                  {t('form.fields.currency.label')}
                                  <RequiredMarker />
                                </FieldLabel>

                                <FieldDescription
                                  className={cn('-mt-1!', {
                                    'opacity-50': isDisabled
                                  })}
                                >
                                  {t('form.fields.currency.description')}
                                </FieldDescription>

                                <div className='flex flex-col gap-3'>
                                  <Select
                                    aria-disabled={isDisabled}
                                    aria-invalid={isInvalid}
                                    data-disabled={isDisabled}
                                    disabled={isDisabled}
                                    name={field.name}
                                    onValueChange={(value) =>
                                      field.handleChange(
                                        value as PaymentCurrencyType
                                      )
                                    }
                                    value={field.state.value}
                                  >
                                    <SelectTrigger
                                      aria-disabled={isDisabled}
                                      aria-invalid={isInvalid}
                                      className={cn(
                                        'px-3! text-base! md:text-sm! group/select-trigger w-full',
                                        {
                                          '[&_svg]:text-destructive!': isInvalid
                                        }
                                      )}
                                      data-disabled={isDisabled}
                                      disabled={isDisabled}
                                      id={field.name}
                                    >
                                      <div className='flex w-[calc(100%-(--spacing(4))-(--spacing(2)))] items-center gap-2'>
                                        <Currency className='text-muted-foreground' />

                                        <div className='line-clamp-1 overflow-ellipsis whitespace-nowrap text-left w-full'>
                                          <SelectValue
                                            placeholder={t(
                                              'form.fields.currency.placeholder'
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </SelectTrigger>

                                    <SelectContent
                                      align='start'
                                      className='max-md:w-(--radix-select-trigger-width) md:min-w-(--radix-select-trigger-width)'
                                    >
                                      {Object.values(PaymentCurrencyType).map(
                                        (currency) => (
                                          <SelectItem
                                            className='text-base! md:text-sm! [&_>_span]:nth-[2]:w-full flex items-center gap-2'
                                            key={currency}
                                            value={currency}
                                          >
                                            {currency}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>

                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </div>
                              </Field>
                            )
                          }}
                        </form.Field>

                        <form.Field name={`data[${index}].extraTaxRate`}>
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            const isDisabled = isLoading

                            return (
                              <Field
                                aria-disabled={isDisabled}
                                className='md:grid md:grid-rows-subgrid md:col-span-1 md:row-span-3 md:min-w-28'
                                data-disabled={isDisabled}
                                data-invalid={isInvalid}
                              >
                                <FieldLabel
                                  className='gap-0.5'
                                  htmlFor={field.name}
                                >
                                  {t('form.fields.extraTaxRate.label')}
                                  <RequiredMarker />
                                </FieldLabel>

                                <FieldDescription
                                  className={cn({
                                    'opacity-50 ': isDisabled
                                  })}
                                >
                                  {t('form.fields.extraTaxRate.description')}
                                </FieldDescription>

                                <div className='flex flex-col gap-3'>
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
                                      min={0}
                                      name={field.name}
                                      onBlur={field.handleBlur}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder={t(
                                        'form.fields.extraTaxRate.placeholder'
                                      )}
                                      step={1}
                                      type='number'
                                      value={field.state.value}
                                    />

                                    <InputGroupAddon align='inline-start'>
                                      <ChartCandlestick className='group-has-aria-invalid/input-group:text-destructive' />
                                    </InputGroupAddon>
                                    <InputGroupAddon align='inline-end'>
                                      <Percent className='group-has-aria-invalid/input-group:text-destructive' />
                                    </InputGroupAddon>
                                  </InputGroup>

                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </div>
                              </Field>
                            )
                          }}
                        </form.Field>

                        <form.Field name={`data[${index}].tvaRate`}>
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              !field.state.meta.isValid
                            const isDisabled = isLoading

                            return (
                              <Field
                                aria-disabled={isDisabled}
                                className='md:grid md:grid-rows-subgrid md:col-span-1 md:row-span-3 md:min-w-28'
                                data-disabled={isDisabled}
                                data-invalid={isInvalid}
                              >
                                <FieldLabel
                                  className='gap-0.5'
                                  htmlFor={field.name}
                                >
                                  {t('form.fields.tvaRate.label')}
                                  <RequiredMarker />
                                </FieldLabel>

                                <FieldDescription
                                  className={cn({
                                    'opacity-50': isDisabled
                                  })}
                                >
                                  {t('form.fields.tvaRate.description')}
                                </FieldDescription>

                                <div className='flex flex-col gap-3'>
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
                                      min={0}
                                      name={field.name}
                                      onBlur={field.handleBlur}
                                      onChange={(e) =>
                                        field.handleChange(e.target.value)
                                      }
                                      placeholder={t(
                                        'form.fields.tvaRate.placeholder'
                                      )}
                                      step={1}
                                      type='number'
                                      value={field.state.value}
                                    />

                                    <InputGroupAddon align='inline-start'>
                                      <Landmark className='group-has-aria-invalid/input-group:text-destructive' />
                                    </InputGroupAddon>
                                    <InputGroupAddon align='inline-end'>
                                      <Percent className='group-has-aria-invalid/input-group:text-destructive' />
                                    </InputGroupAddon>
                                  </InputGroup>

                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </div>
                              </Field>
                            )
                          }}
                        </form.Field>
                      </FieldGroup>
                    </FieldSet>

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
              currency: PaymentCurrencyType.EUR,
              extraTaxRate: '0',
              label: '',
              tvaRate: '0'
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
