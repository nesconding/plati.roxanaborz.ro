'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeEuro,
  BanknoteArrowDown,
  CalendarSync,
  Equal,
  Euro,
  FilePenLine,
  Hourglass,
  Plus,
  Save,
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

const formId = 'edit-product-form'

const schema = z.object({
  extensions: z.array(
    z.object({
      extensionMonths: NumericString(),
      id: z.string().nonempty().optional(),
      installments: z.array(
        z.object({
          count: NumericString(),
          id: z.string().nonempty().optional(),
          pricePerInstallment: NumericString()
        })
      ),
      minDepositAmount: NumericString(),
      price: NumericString()
    })
  ),
  id: z.string().nonempty(),
  installments: z.array(
    z.object({
      count: NumericString(),
      id: z.string().nonempty().optional(),
      pricePerInstallment: NumericString()
    })
  ),
  membershipDurationMonths: NumericString(),
  minDepositAmount: NumericString(),
  name: z.string().nonempty(),
  price: NumericString()
})

interface ProductEditPageModuleProps {
  productId: string
}
export function ProductEditPageModule({
  productId
}: ProductEditPageModuleProps) {
  const t = useTranslations()
  const trpc = useTRPC()
  const updateOneProduct = useMutation(
    trpc.admin.products.updateOne.mutationOptions()
  )
  const queryClient = useQueryClient()
  const findOneProduct = useQuery(
    trpc.protected.products.findOneById.queryOptions({ productId })
  )

  const defaultValues: z.infer<typeof schema> = {
    extensions:
      findOneProduct.data?.extensions.map((extension) => ({
        ...extension,
        extensionMonths: extension.extensionMonths.toString(),
        installments: extension.installments.map((installment) => ({
          ...installment,
          count: installment.count.toString()
        }))
      })) ?? [],
    id: findOneProduct.data?.id ?? '',
    installments:
      findOneProduct.data?.installments.map((installment) => ({
        ...installment,
        count: installment.count.toString()
      })) ?? [],
    membershipDurationMonths:
      findOneProduct.data?.membershipDurationMonths.toString() ?? '',
    minDepositAmount: findOneProduct.data?.minDepositAmount.toString() ?? '',
    name: findOneProduct.data?.name ?? '',
    price: findOneProduct.data?.price.toString() ?? ''
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      updateOneProduct.mutate(value, {
        onError: (error) => {
          console.error(error)
          toast.error(
            t('modules.(app).(admin).products.edit.response.error.title'),
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
                      'modules.(app).(admin).products.edit.response.error.description'
                    )
            }
          )
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.protected.products.findAll.queryKey()
          })
          await queryClient.invalidateQueries({
            queryKey: trpc.protected.products.findOneById.queryKey({
              productId
            })
          })
          toast.success(
            t('modules.(app).(admin).products.edit.response.success.title'),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).products.edit.response.success.description'
              )
            }
          )
          form.reset()
          updateOneProduct.reset()
        }
      })
    },
    validators: { onSubmit: schema }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const canSubmit = useStore(
    form.store,
    (state) => state.canSubmit && !state.isDefaultValue
  )

  const isLoading = isSubmitting || updateOneProduct.isPending

  function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <div className='p-4'>
      <form id={formId} onSubmit={handleOnSubmit}>
        <FieldGroup>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('modules.(app).(admin).products.edit.form.fields.title')}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                <FieldGroup className='items-start sm:flex-row'>
                  <form.AppField name='name'>
                    {(field) => (
                      <field.Text
                        addons={[{ icon: FilePenLine }]}
                        autoComplete='off'
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.edit.form.fields.name.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.edit.form.fields.name.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name='membershipDurationMonths'>
                    {(field) => (
                      <field.Number
                        addons={[
                          { icon: Hourglass },
                          {
                            align: 'inline-end',
                            text: t(
                              'modules.(app).(admin).products.edit.form.fields.membershipDurationMonths.addon'
                            )
                          }
                        ]}
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.edit.form.fields.membershipDurationMonths.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.edit.form.fields.membershipDurationMonths.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>

                <FieldGroup className='items-start sm:flex-row'>
                  <form.AppField name='price'>
                    {(field) => (
                      <field.Number
                        addons={[
                          { icon: BadgeEuro },
                          { align: 'inline-end', icon: Euro }
                        ]}
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.edit.form.fields.price.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.edit.form.fields.price.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>

                  <form.AppField name='minDepositAmount'>
                    {(field) => (
                      <field.Number
                        addons={[
                          { icon: BanknoteArrowDown },
                          { align: 'inline-end', icon: Euro }
                        ]}
                        isLoading={isLoading}
                        label={t(
                          'modules.(app).(admin).products.edit.form.fields.minDepositAmount.label'
                        )}
                        placeholder={t(
                          'modules.(app).(admin).products.edit.form.fields.minDepositAmount.placeholder'
                        )}
                      />
                    )}
                  </form.AppField>
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
                      'modules.(app).(admin).products.edit.form.fields.installments.title'
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
                                'modules.(app).(admin).products.edit.form.fields.installments.fields.count.header'
                              )}
                            </div>
                            <div />
                            <div>
                              {t(
                                'modules.(app).(admin).products.edit.form.fields.installments.fields.pricePerInstallment.header'
                              )}
                            </div>
                            <div />
                            <div className='text-right'>
                              {t(
                                'modules.(app).(admin).products.edit.form.fields.installments.fields.totalPrice.header'
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
                              key={`${installment.id}-${index}`}
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
                                            'modules.(app).(admin).products.edit.form.fields.installments.fields.count.placeholder'
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
                                            'modules.(app).(admin).products.edit.form.fields.installments.fields.pricePerInstallment.placeholder'
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
                      'modules.(app).(admin).products.edit.form.fields.installments.add'
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
                      'modules.(app).(admin).products.edit.form.fields.extensions.title'
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
                                'modules.(app).(admin).products.edit.form.fields.extensions.fields.legend',
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
                                'modules.(app).(admin).products.edit.form.fields.extensions.remove'
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
                                          'modules.(app).(admin).products.edit.form.fields.extensions.fields.extensionMonths.label'
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
                                            'modules.(app).(admin).products.edit.form.fields.extensions.fields.extensionMonths.placeholder'
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
                                              'modules.(app).(admin).products.edit.form.fields.membershipDurationMonths.addon'
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
                                name={`extensions[${extensionIndex}].minDepositAmount`}
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
                                          'modules.(app).(admin).products.edit.form.fields.extensions.fields.minDepositAmount.label'
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
                                            'modules.(app).(admin).products.edit.form.fields.extensions.fields.minDepositAmount.placeholder'
                                          )}
                                          step={1}
                                          type='number'
                                          value={subField.state.value}
                                        />

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
                                          'modules.(app).(admin).products.edit.form.fields.extensions.fields.price.label'
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
                                            'modules.(app).(admin).products.edit.form.fields.extensions.fields.price.placeholder'
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
                                          'modules.(app).(admin).products.edit.form.fields.extensions.fields.installments.title'
                                        )}
                                      </FieldLegend>

                                      <FieldGroup>
                                        <ScrollArea className='rounded-lg border'>
                                          <div className='grid grid-cols-[auto_1fr_auto_1fr_auto_auto]'>
                                            <div className='text-muted-foreground col-span-6 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                                              <div>
                                                {t(
                                                  'modules.(app).(admin).products.edit.form.fields.installments.fields.count.header'
                                                )}
                                              </div>
                                              <div />
                                              <div>
                                                {t(
                                                  'modules.(app).(admin).products.edit.form.fields.installments.fields.pricePerInstallment.header'
                                                )}
                                              </div>
                                              <div />
                                              <div className='text-right'>
                                                {t(
                                                  'modules.(app).(admin).products.edit.form.fields.installments.fields.totalPrice.header'
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
                                                    'col-span-6 grid grid-cols-subgrid items-start gap-4 p-4',
                                                    {
                                                      'border-b':
                                                        extensionInstallmentsIndex <
                                                        extensionInstallmentsField
                                                          .state.value.length -
                                                          1
                                                    }
                                                  )}
                                                  key={`${installment.id}-${extensionInstallmentsIndex}`}
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
                                                                'modules.(app).(admin).products.edit.form.fields.extensions.fields.installments.fields.count.placeholder'
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

                                                  <div className='flex items-center justify-center size-9'>
                                                    <X className='text-muted-foreground size-3 place-self-center' />
                                                  </div>

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
                                                                'modules.(app).(admin).products.edit.form.fields.extensions.fields.installments.fields.pricePerInstallment.placeholder'
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

                                                  <div className='flex items-center justify-center size-9'>
                                                    <Equal className='text-muted-foreground size-3 place-self-center' />
                                                  </div>

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
                                      'modules.(app).(admin).products.edit.form.fields.extensions.fields.installments.add'
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
                        minDepositAmount: '',
                        price: ''
                      })
                    }
                    type='button'
                    variant='default'
                  >
                    <Plus />
                    {t(
                      'modules.(app).(admin).products.edit.form.fields.extensions.add'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </form.AppField>

          <Field className='sm:ml-auto sm:w-fit'>
            <Button
              disabled={isLoading || !canSubmit}
              form={formId}
              type='submit'
            >
              {isLoading ? <Spinner /> : <Save />}
              {isLoading
                ? t(
                    'modules.(app).(admin).products.edit.form.buttons.submit.loading'
                  )
                : t(
                    'modules.(app).(admin).products.edit.form.buttons.submit.default'
                  )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
