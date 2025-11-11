'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BadgeEuro,
  BanknoteArrowDown,
  CalendarSync,
  Equal,
  Euro,
  FilePenLine,
  Hourglass,
  PackagePlus,
  Plus,
  X,
  XCircle
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { toast } from 'sonner'
import z from 'zod'

import { useAppForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import {
  Field,
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
  InputGroupInput,
  InputGroupText
} from '~/client/components/ui/input-group'
import { ScrollArea, ScrollBar } from '~/client/components/ui/scroll-area'
import { Spinner } from '~/client/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { NumericString } from '~/shared/validation/utils'

const formId = 'create-product-form'

const schema = z.object({
  extensions: z.array(
    z.object({
      extensionMonths: NumericString(),
      installments: z.array(
        z.object({
          count: NumericString(),
          pricePerInstallment: NumericString()
        })
      ),
      isDepositAmountEnabled: z.boolean(),
      minDepositAmount: z.union([z.literal(''), NumericString()]),
      price: NumericString()
    })
  ),
  installments: z.array(
    z.object({
      count: NumericString(),
      pricePerInstallment: NumericString()
    })
  ),
  isDepositAmountEnabled: z.boolean(),
  membershipDurationMonths: NumericString(),
  minDepositAmount: z.union([z.literal(''), NumericString()]),
  name: z.string().nonempty(),
  price: NumericString()
})

const defaultValues: z.infer<typeof schema> = {
  extensions: [],
  installments: [],
  isDepositAmountEnabled: false,
  membershipDurationMonths: '',
  minDepositAmount: '',
  name: '',
  price: ''
}

export function ProductsCreatePageModule() {
  const t = useTranslations()
  const trpc = useTRPC()
  const createOneProduct = useMutation(
    trpc.admin.products.createOne.mutationOptions()
  )
  const queryClient = useQueryClient()

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      createOneProduct.mutate(value, {
        onError: (error) => {
          console.error(error)
          toast.error(
            t('modules.(app).(admin).products.create.response.error.title'),
            {
              className: '!text-destructive-foreground',
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-destructive',
                title: '!text-destructive'
              },
              description:
                error instanceof Error
                  ? error.message
                  : t(
                      'modules.(app).(admin).products.create.response.error.description'
                    )
            }
          )
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.protected.products.findAll.queryKey()
          })
          toast.success(
            t('modules.(app).(admin).products.create.response.success.title'),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).products.create.response.success.description'
              )
            }
          )
          form.reset()
          createOneProduct.reset()
        }
      })
    },
    validators: { onSubmit: schema }
  })

  function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    form.handleSubmit()
  }

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isLoading = isSubmitting || createOneProduct.isPending

  return (
    <div className='p-4'>
      <form id={formId} onSubmit={handleOnSubmit}>
        <FieldGroup>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('modules.(app).(admin).products.create.form.fields.title')}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                <form.AppField name='name'>
                  {(field) => (
                    <field.Text
                      addons={[{ icon: FilePenLine }]}
                      autoComplete='off'
                      isLoading={isLoading}
                      label={t(
                        'modules.(app).(admin).products.create.form.fields.name.label'
                      )}
                      placeholder={t(
                        'modules.(app).(admin).products.create.form.fields.name.placeholder'
                      )}
                    />
                  )}
                </form.AppField>

                <FieldGroup className='items-start sm:flex-row'>
                  <form.AppField name='membershipDurationMonths'>
                    {(field) => (
                      <field.Number
                        addons={[
                          { icon: Hourglass },
                          {
                            align: 'inline-end',
                            text: t(
                              'modules.(app).(admin).products.create.form.fields.membershipDurationMonths.addon'
                            )
                          }
                        ]}
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.create.form.fields.membershipDurationMonths.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.create.form.fields.membershipDurationMonths.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name='price'>
                    {(field) => (
                      <field.Number
                        addons={[
                          { icon: BadgeEuro },
                          { align: 'inline-end', icon: Euro }
                        ]}
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.create.form.fields.price.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.create.form.fields.price.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>

                <FieldGroup className='items-start sm:flex-row'>
                  <form.AppField name='isDepositAmountEnabled'>
                    {(field) => {
                      function onCheckedChange(checked: boolean) {
                        field.handleChange(checked)
                        if (!checked) {
                          form.resetField('minDepositAmount')
                        }
                      }

                      return (
                        <field.Switch
                          className='sm:mt-[calc((var(--leading-snug)*var(--text-sm))+(--spacing(3)))] items-center! sm:h-9'
                          isLoading={isLoading}
                          label={t(
                            'modules.(app).(admin).products.create.form.fields.isDepositAmountEnabled.label'
                          )}
                          onCheckedChange={onCheckedChange}
                        />
                      )
                    }}
                  </form.AppField>

                  <form.Subscribe
                    selector={({ values }) => values.isDepositAmountEnabled}
                  >
                    {(isDepositAmountEnabled) => (
                      <form.AppField name='minDepositAmount'>
                        {(field) => (
                          <field.Number
                            addons={
                              isDepositAmountEnabled
                                ? [
                                    { icon: BanknoteArrowDown },
                                    { align: 'inline-end', icon: Euro }
                                  ]
                                : undefined
                            }
                            isDisabled={!isDepositAmountEnabled}
                            isLoading={isLoading}
                            label={t(
                              'modules.(app).(admin).products.create.form.fields.minDepositAmount.label'
                            )}
                            placeholder={
                              isDepositAmountEnabled
                                ? t(
                                    'modules.(app).(admin).products.create.form.fields.minDepositAmount.placeholder'
                                  )
                                : undefined
                            }
                          />
                        )}
                      </form.AppField>
                    )}
                  </form.Subscribe>
                </FieldGroup>
              </FieldGroup>
            </CardContent>
          </Card>

          <form.AppField name='installments'>
            {(field) => (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t(
                      'modules.(app).(admin).products.create.form.fields.installments.title'
                    )}
                  </CardTitle>
                </CardHeader>

                {field.state.value.length > 0 && (
                  <CardContent>
                    <FieldGroup>
                      <ScrollArea className='rounded-lg border'>
                        <div className='grid grid-cols-[auto_1fr_auto_1fr_auto_auto]'>
                          <div className='text-muted-foreground col-span-6 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                            <div>
                              {t(
                                'modules.(app).(admin).products.create.form.fields.installments.fields.count.header'
                              )}
                            </div>
                            <div />
                            <div>
                              {t(
                                'modules.(app).(admin).products.create.form.fields.installments.fields.pricePerInstallment.header'
                              )}
                            </div>
                            <div />
                            <div className='text-right'>
                              {t(
                                'modules.(app).(admin).products.create.form.fields.installments.fields.totalPrice.header'
                              )}
                            </div>
                            <div />
                          </div>

                          {field.state.value.map((installment, index) => (
                            <div
                              className={cn(
                                'col-span-6 grid grid-cols-subgrid items-center gap-4 p-4',
                                {
                                  'border-b':
                                    index < field.state.value.length - 1
                                }
                              )}
                              // biome-ignore lint/suspicious/noArrayIndexKey: <>
                              key={index}
                            >
                              <form.Field name={`installments[${index}].count`}>
                                {(subField) => {
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
                                      <InputGroup
                                        aria-disabled={isDisabled}
                                        aria-invalid={isInvalid}
                                        className={cn('min-w-24', {
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
                                            subField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          placeholder={t(
                                            'modules.(app).(admin).products.create.form.fields.installments.fields.count.placeholder'
                                          )}
                                          step={1}
                                          type='number'
                                          value={subField.state.value}
                                        />

                                        <InputGroupAddon align='inline-start'>
                                          <CalendarSync
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                      </InputGroup>

                                      {isInvalid && (
                                        <FieldError
                                          errors={field.state.meta.errors}
                                        />
                                      )}
                                    </Field>
                                  )
                                }}
                              </form.Field>

                              <X className='text-muted-foreground size-3 place-self-center' />

                              <form.Field
                                name={`installments[${index}].pricePerInstallment`}
                              >
                                {(subField) => {
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
                                      <InputGroup
                                        aria-disabled={isDisabled}
                                        aria-invalid={isInvalid}
                                        className={cn('min-w-56', {
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
                                            subField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          placeholder={t(
                                            'modules.(app).(admin).products.create.form.fields.installments.fields.pricePerInstallment.placeholder'
                                          )}
                                          step={1}
                                          type='number'
                                          value={subField.state.value}
                                        />

                                        <InputGroupAddon align='inline-start'>
                                          <BadgeEuro
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                        <InputGroupAddon align='inline-end'>
                                          <Euro
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                      </InputGroup>

                                      {isInvalid && (
                                        <FieldError
                                          errors={field.state.meta.errors}
                                        />
                                      )}
                                    </Field>
                                  )
                                }}
                              </form.Field>

                              <Equal className='text-muted-foreground size-3 place-self-center' />

                              <Tooltip>
                                <TooltipTrigger className='text-right font-medium underline'>
                                  {PricingService.formatPrice(
                                    PricingService.multiply(
                                      installment.pricePerInstallment === ''
                                        ? 0
                                        : installment.pricePerInstallment,
                                      installment.count === ''
                                        ? 0
                                        : installment.count
                                    ),
                                    'EUR'
                                  )}
                                </TooltipTrigger>
                                <TooltipContent className='flex items-center gap-1'>
                                  <p>
                                    {installment.count === ''
                                      ? 0
                                      : installment.count}
                                  </p>
                                  <X className='size-3' />
                                  <p>{`${installment.pricePerInstallment === '' ? 0 : installment.pricePerInstallment} €`}</p>
                                  <Equal className='size-3' />
                                  <p>
                                    {`${PricingService.multiply(
                                      installment.pricePerInstallment === ''
                                        ? 0
                                        : installment.pricePerInstallment,
                                      installment.count === ''
                                        ? 0
                                        : installment.count
                                    ).toString()} €`}
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Button
                                disabled={isLoading}
                                onClick={() => field.removeValue(index)}
                                size='icon-sm'
                                type='button'
                                variant='destructive'
                              >
                                <XCircle />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation='horizontal' />
                      </ScrollArea>
                    </FieldGroup>
                  </CardContent>
                )}

                <CardFooter>
                  <Button
                    className='ml-auto'
                    disabled={isLoading}
                    onClick={() =>
                      field.pushValue({ count: '', pricePerInstallment: '' })
                    }
                    type='button'
                  >
                    <Plus />
                    {t(
                      'modules.(app).(admin).products.create.form.fields.installments.add'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </form.AppField>

          <form.AppField name='extensions'>
            {(extensionsField) => (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t(
                      'modules.(app).(admin).products.create.form.fields.extensions.title'
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <FieldGroup>
                    {extensionsField.state.value.map((_, extensionIndex) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: <>
                      <Fragment key={extensionIndex}>
                        <FieldSet className='gap-3'>
                          <div className='flex items-center justify-between'>
                            <FieldLegend variant='label'>
                              {t(
                                'modules.(app).(admin).products.create.form.fields.extensions.fields.legend',
                                {
                                  number: extensionIndex + 1
                                }
                              )}
                            </FieldLegend>

                            <Button
                              disabled={isLoading}
                              onClick={() =>
                                extensionsField.removeValue(extensionIndex)
                              }
                              size='sm'
                              type='button'
                              variant='destructive'
                            >
                              <XCircle />
                              {t(
                                'modules.(app).(admin).products.create.form.fields.extensions.remove'
                              )}
                            </Button>
                          </div>

                          <FieldGroup>
                            <FieldGroup className='items-start sm:flex-row'>
                              <form.Field
                                name={`extensions[${extensionIndex}].extensionMonths`}
                              >
                                {(subField) => {
                                  const isInvalid =
                                    subField.state.meta.isTouched &&
                                    !subField.state.meta.isValid
                                  const isDisabled = isLoading

                                  return (
                                    <Field
                                      aria-disabled={isDisabled}
                                      data-disabled={isDisabled}
                                      data-invalid={isInvalid}
                                    >
                                      <FieldLabel htmlFor={subField.name}>
                                        {t(
                                          'modules.(app).(admin).products.create.form.fields.extensions.fields.extensionMonths.label'
                                        )}
                                      </FieldLabel>

                                      <InputGroup
                                        aria-disabled={isDisabled}
                                        aria-invalid={isInvalid}
                                        className={cn({
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
                                          id={subField.name}
                                          min={1}
                                          name={subField.name}
                                          onBlur={subField.handleBlur}
                                          onChange={(e) =>
                                            subField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          placeholder={t(
                                            'modules.(app).(admin).products.create.form.fields.extensions.fields.extensionMonths.placeholder'
                                          )}
                                          step={1}
                                          type='number'
                                          value={subField.state.value}
                                        />

                                        <InputGroupAddon align='inline-start'>
                                          <Hourglass
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                        <InputGroupAddon align='inline-end'>
                                          <InputGroupText>
                                            {t(
                                              'modules.(app).(admin).products.create.form.fields.membershipDurationMonths.addon'
                                            )}
                                          </InputGroupText>
                                        </InputGroupAddon>
                                      </InputGroup>

                                      {isInvalid && (
                                        <FieldError
                                          errors={subField.state.meta.errors}
                                        />
                                      )}
                                    </Field>
                                  )
                                }}
                              </form.Field>

                              <form.Field
                                name={`extensions[${extensionIndex}].price`}
                              >
                                {(subField) => {
                                  const isInvalid =
                                    subField.state.meta.isTouched &&
                                    !subField.state.meta.isValid
                                  const isDisabled = isLoading

                                  return (
                                    <Field
                                      aria-disabled={isDisabled}
                                      data-disabled={isDisabled}
                                      data-invalid={isInvalid}
                                    >
                                      <FieldLabel htmlFor={subField.name}>
                                        {t(
                                          'modules.(app).(admin).products.create.form.fields.extensions.fields.price.label'
                                        )}
                                      </FieldLabel>

                                      <InputGroup
                                        aria-disabled={isDisabled}
                                        aria-invalid={isInvalid}
                                        className={cn({
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
                                          id={subField.name}
                                          min={1}
                                          name={subField.name}
                                          onBlur={subField.handleBlur}
                                          onChange={(e) =>
                                            subField.handleChange(
                                              e.target.value
                                            )
                                          }
                                          placeholder={t(
                                            'modules.(app).(admin).products.create.form.fields.extensions.fields.price.placeholder'
                                          )}
                                          step={1}
                                          type='number'
                                          value={subField.state.value}
                                        />

                                        <InputGroupAddon align='inline-start'>
                                          <BadgeEuro
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                        <InputGroupAddon align='inline-end'>
                                          <Euro
                                            className={cn(
                                              'group-has-aria-invalid/input-group:text-destructive'
                                            )}
                                          />
                                        </InputGroupAddon>
                                      </InputGroup>

                                      {isInvalid && (
                                        <FieldError
                                          errors={subField.state.meta.errors}
                                        />
                                      )}
                                    </Field>
                                  )
                                }}
                              </form.Field>
                            </FieldGroup>

                            <FieldGroup className='items-start sm:flex-row'>
                              <form.AppField
                                name={`extensions[${extensionIndex}].isDepositAmountEnabled`}
                              >
                                {(field) => {
                                  function onCheckedChange(checked: boolean) {
                                    field.handleChange(checked)
                                    if (!checked) {
                                      form.resetField(
                                        `extensions[${extensionIndex}].minDepositAmount`
                                      )
                                    }
                                  }

                                  return (
                                    <field.Switch
                                      className='sm:mt-[calc((var(--leading-snug)*var(--text-sm))+(--spacing(3)))] items-center! sm:h-9'
                                      isLoading={isLoading}
                                      label={t(
                                        'modules.(app).(admin).products.create.form.fields.extensions.fields.isDepositAmountEnabled.label'
                                      )}
                                      onCheckedChange={onCheckedChange}
                                    />
                                  )
                                }}
                              </form.AppField>

                              <form.Subscribe
                                selector={({ values }) =>
                                  values.extensions[extensionIndex]
                                    .isDepositAmountEnabled
                                }
                              >
                                {(isDepositAmountEnabled) => (
                                  <form.Field
                                    name={`extensions[${extensionIndex}].minDepositAmount`}
                                  >
                                    {(subField) => {
                                      const isInvalid =
                                        subField.state.meta.isTouched &&
                                        !subField.state.meta.isValid
                                      const isDisabled =
                                        isLoading || !isDepositAmountEnabled

                                      return (
                                        <Field
                                          aria-disabled={isDisabled}
                                          data-disabled={isDisabled}
                                          data-invalid={isInvalid}
                                        >
                                          <FieldLabel htmlFor={subField.name}>
                                            {t(
                                              'modules.(app).(admin).products.create.form.fields.extensions.fields.minDepositAmount.label'
                                            )}
                                          </FieldLabel>

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
                                              id={subField.name}
                                              min={1}
                                              name={subField.name}
                                              onBlur={subField.handleBlur}
                                              onChange={(e) =>
                                                subField.handleChange(
                                                  e.target.value
                                                )
                                              }
                                              placeholder={
                                                isDepositAmountEnabled
                                                  ? t(
                                                      'modules.(app).(admin).products.create.form.fields.extensions.fields.minDepositAmount.placeholder'
                                                    )
                                                  : undefined
                                              }
                                              step={1}
                                              type='number'
                                              value={subField.state.value}
                                            />

                                            {isDepositAmountEnabled && (
                                              <>
                                                <InputGroupAddon align='inline-start'>
                                                  <BanknoteArrowDown
                                                    className={cn(
                                                      'group-has-aria-invalid/input-group:text-destructive'
                                                    )}
                                                  />
                                                </InputGroupAddon>
                                                <InputGroupAddon align='inline-end'>
                                                  <Euro
                                                    className={cn(
                                                      'group-has-aria-invalid/input-group:text-destructive'
                                                    )}
                                                  />
                                                </InputGroupAddon>
                                              </>
                                            )}
                                          </InputGroup>

                                          {isInvalid && (
                                            <FieldError
                                              errors={
                                                subField.state.meta.errors
                                              }
                                            />
                                          )}
                                        </Field>
                                      )
                                    }}
                                  </form.Field>
                                )}
                              </form.Subscribe>
                            </FieldGroup>

                            <form.Field
                              mode='array'
                              name={`extensions[${extensionIndex}].installments`}
                            >
                              {(extensionInstallmentsField) => (
                                <FieldSet>
                                  {extensionInstallmentsField.state.value
                                    .length > 0 && (
                                    <Fragment>
                                      <FieldLegend variant='label'>
                                        {t(
                                          'modules.(app).(admin).products.create.form.fields.extensions.fields.installments.title'
                                        )}
                                      </FieldLegend>

                                      <FieldGroup>
                                        <ScrollArea className='rounded-lg border'>
                                          <div className='grid grid-cols-[auto_1fr_auto_1fr_auto_auto]'>
                                            <div className='text-muted-foreground col-span-6 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                                              <div>
                                                {t(
                                                  'modules.(app).(admin).products.create.form.fields.installments.fields.count.header'
                                                )}
                                              </div>
                                              <div />
                                              <div>
                                                {t(
                                                  'modules.(app).(admin).products.create.form.fields.installments.fields.pricePerInstallment.header'
                                                )}
                                              </div>
                                              <div />
                                              <div className='text-right'>
                                                {t(
                                                  'modules.(app).(admin).products.create.form.fields.installments.fields.totalPrice.header'
                                                )}
                                              </div>
                                              <div />
                                            </div>

                                            {extensionInstallmentsField.state.value.map(
                                              (
                                                installment,
                                                extensionInstallmentsIndex
                                              ) => (
                                                <div
                                                  className={cn(
                                                    'col-span-6 grid grid-cols-subgrid items-center gap-4 p-4',
                                                    {
                                                      'border-b':
                                                        extensionInstallmentsIndex <
                                                        extensionInstallmentsField
                                                          .state.value.length -
                                                          1
                                                    }
                                                  )}
                                                  key={
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                                    extensionInstallmentsIndex
                                                  }
                                                >
                                                  <form.Field
                                                    name={`extensions[${extensionIndex}].installments[${extensionInstallmentsIndex}].count`}
                                                  >
                                                    {(subField) => {
                                                      const isInvalid =
                                                        subField.state.meta
                                                          .isTouched &&
                                                        !subField.state.meta
                                                          .isValid
                                                      const isDisabled =
                                                        isLoading

                                                      return (
                                                        <Field
                                                          aria-disabled={
                                                            isDisabled
                                                          }
                                                          data-disabled={
                                                            isDisabled
                                                          }
                                                          data-invalid={
                                                            isInvalid
                                                          }
                                                        >
                                                          <InputGroup
                                                            aria-disabled={
                                                              isDisabled
                                                            }
                                                            aria-invalid={
                                                              isInvalid
                                                            }
                                                            className={cn({
                                                              'opacity-50':
                                                                isDisabled
                                                            })}
                                                            data-disabled={
                                                              isDisabled
                                                            }
                                                          >
                                                            <InputGroupInput
                                                              aria-disabled={
                                                                isDisabled
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                              className='overflow-ellipsis'
                                                              data-disabled={
                                                                isDisabled
                                                              }
                                                              disabled={
                                                                isDisabled
                                                              }
                                                              id={subField.name}
                                                              min={1}
                                                              name={
                                                                subField.name
                                                              }
                                                              onBlur={
                                                                subField.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                subField.handleChange(
                                                                  e.target.value
                                                                )
                                                              }
                                                              placeholder={t(
                                                                'modules.(app).(admin).products.create.form.fields.extensions.fields.installments.fields.count.placeholder'
                                                              )}
                                                              step={1}
                                                              type='number'
                                                              value={
                                                                subField.state
                                                                  .value
                                                              }
                                                            />

                                                            <InputGroupAddon align='inline-start'>
                                                              <CalendarSync
                                                                className={cn(
                                                                  'group-has-aria-invalid/input-group:text-destructive'
                                                                )}
                                                              />
                                                            </InputGroupAddon>
                                                          </InputGroup>

                                                          {isInvalid && (
                                                            <FieldError
                                                              errors={
                                                                subField.state
                                                                  .meta.errors
                                                              }
                                                            />
                                                          )}
                                                        </Field>
                                                      )
                                                    }}
                                                  </form.Field>

                                                  <X className='text-muted-foreground size-3 place-self-center' />

                                                  <form.Field
                                                    name={`extensions[${extensionIndex}].installments[${extensionInstallmentsIndex}].pricePerInstallment`}
                                                  >
                                                    {(subField) => {
                                                      const isInvalid =
                                                        subField.state.meta
                                                          .isTouched &&
                                                        !subField.state.meta
                                                          .isValid
                                                      const isDisabled =
                                                        isLoading

                                                      return (
                                                        <Field
                                                          aria-disabled={
                                                            isDisabled
                                                          }
                                                          data-disabled={
                                                            isDisabled
                                                          }
                                                          data-invalid={
                                                            isInvalid
                                                          }
                                                        >
                                                          <InputGroup
                                                            aria-disabled={
                                                              isDisabled
                                                            }
                                                            aria-invalid={
                                                              isInvalid
                                                            }
                                                            className={cn({
                                                              'opacity-50':
                                                                isDisabled
                                                            })}
                                                            data-disabled={
                                                              isDisabled
                                                            }
                                                          >
                                                            <InputGroupInput
                                                              aria-disabled={
                                                                isDisabled
                                                              }
                                                              aria-invalid={
                                                                isInvalid
                                                              }
                                                              className='overflow-ellipsis'
                                                              data-disabled={
                                                                isDisabled
                                                              }
                                                              disabled={
                                                                isDisabled
                                                              }
                                                              id={subField.name}
                                                              min={1}
                                                              name={
                                                                subField.name
                                                              }
                                                              onBlur={
                                                                subField.handleBlur
                                                              }
                                                              onChange={(e) =>
                                                                subField.handleChange(
                                                                  e.target.value
                                                                )
                                                              }
                                                              placeholder={t(
                                                                'modules.(app).(admin).products.create.form.fields.extensions.fields.installments.fields.pricePerInstallment.placeholder'
                                                              )}
                                                              step={1}
                                                              type='number'
                                                              value={
                                                                subField.state
                                                                  .value
                                                              }
                                                            />

                                                            <InputGroupAddon align='inline-start'>
                                                              <BadgeEuro
                                                                className={cn(
                                                                  'group-has-aria-invalid/input-group:text-destructive'
                                                                )}
                                                              />
                                                            </InputGroupAddon>
                                                            <InputGroupAddon align='inline-end'>
                                                              <Euro
                                                                className={cn(
                                                                  'group-has-aria-invalid/input-group:text-destructive'
                                                                )}
                                                              />
                                                            </InputGroupAddon>
                                                          </InputGroup>

                                                          {isInvalid && (
                                                            <FieldError
                                                              errors={
                                                                subField.state
                                                                  .meta.errors
                                                              }
                                                            />
                                                          )}
                                                        </Field>
                                                      )
                                                    }}
                                                  </form.Field>

                                                  <Equal className='text-muted-foreground size-3 place-self-center' />

                                                  <Tooltip>
                                                    <TooltipTrigger className='text-right font-medium underline'>
                                                      {PricingService.formatPrice(
                                                        PricingService.multiply(
                                                          installment.pricePerInstallment ===
                                                            ''
                                                            ? 0
                                                            : installment.pricePerInstallment,
                                                          installment.count ===
                                                            ''
                                                            ? 0
                                                            : installment.count
                                                        ),
                                                        'EUR'
                                                      )}
                                                    </TooltipTrigger>
                                                    <TooltipContent className='flex items-center gap-1'>
                                                      <p>
                                                        {installment.count ===
                                                        ''
                                                          ? 0
                                                          : installment.count}
                                                      </p>
                                                      <X className='size-3' />
                                                      <p>{`${installment.pricePerInstallment === '' ? 0 : installment.pricePerInstallment} €`}</p>
                                                      <Equal className='size-3' />
                                                      <p>
                                                        {`${PricingService.multiply(
                                                          installment.pricePerInstallment ===
                                                            ''
                                                            ? 0
                                                            : installment.pricePerInstallment,
                                                          installment.count ===
                                                            ''
                                                            ? 0
                                                            : installment.count
                                                        ).toString()} €`}
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>

                                                  <Button
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                      extensionInstallmentsField.removeValue(
                                                        extensionInstallmentsIndex
                                                      )
                                                    }
                                                    size='icon-sm'
                                                    type='button'
                                                    variant='destructive'
                                                  >
                                                    <XCircle />
                                                  </Button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                          <ScrollBar orientation='horizontal' />
                                        </ScrollArea>
                                      </FieldGroup>
                                    </Fragment>
                                  )}

                                  <Button
                                    className='ml-auto'
                                    disabled={isLoading}
                                    onClick={() =>
                                      extensionInstallmentsField.pushValue({
                                        count: '',
                                        pricePerInstallment: ''
                                      })
                                    }
                                    type='button'
                                    variant='outline'
                                  >
                                    <Plus />
                                    {t(
                                      'modules.(app).(admin).products.create.form.fields.extensions.fields.installments.add'
                                    )}
                                  </Button>
                                </FieldSet>
                              )}
                            </form.Field>
                          </FieldGroup>
                        </FieldSet>

                        {extensionIndex <
                          extensionsField.state.value.length - 1 && (
                          <FieldSeparator />
                        )}
                      </Fragment>
                    ))}
                  </FieldGroup>
                </CardContent>

                <CardFooter>
                  <Button
                    className='ml-auto'
                    disabled={isLoading}
                    onClick={() =>
                      extensionsField.pushValue({
                        extensionMonths: '',
                        installments: [],
                        isDepositAmountEnabled: false,
                        minDepositAmount: '',
                        price: ''
                      })
                    }
                    type='button'
                    variant='default'
                  >
                    <Plus />
                    {t(
                      'modules.(app).(admin).products.create.form.fields.extensions.add'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </form.AppField>

          <Field className='sm:ml-auto sm:w-fit'>
            <Button disabled={isLoading} form={formId} type='submit'>
              {isLoading ? <Spinner /> : <PackagePlus />}
              {isLoading
                ? t(
                    'modules.(app).(admin).products.create.form.buttons.submit.loading'
                  )
                : t(
                    'modules.(app).(admin).products.create.form.buttons.submit.default'
                  )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
