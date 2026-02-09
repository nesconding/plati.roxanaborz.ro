'use client'

import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  CalendarPlus,
  ChevronDown,
  CircleX,
  Mail,
  Plus,
  User
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/client/components/ui/button'
import { Calendar } from '~/client/components/ui/calendar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/client/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/client/components/ui/field'
import { Input } from '~/client/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
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
import {
  CreateMembershipFormDefaultValues,
  CreateMembershipFormSchema
} from '~/shared/create-membership-form/create-membership-form-schema'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

interface CreateMembershipDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
}

const formId = 'create-membership-dialog-form'

export function CreateMembershipDialog({
  isOpen,
  onCloseDialog
}: CreateMembershipDialogProps) {
  const t = useTranslations(
    'modules.(app).memberships._components.create-membership-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [startCalendarOpen, setStartCalendarOpen] = useState(false)
  const [endCalendarOpen, setEndCalendarOpen] = useState(false)
  const [delayedCalendarOpen, setDelayedCalendarOpen] = useState(false)

  const getProducts = useQuery(
    trpc.protected.products.findAll.queryOptions(undefined, {
      enabled: isOpen
    })
  )

  const statusOptions = [
    {
      label: t('fields.status.options.active'),
      value: MembershipStatusType.Active
    },
    {
      label: t('fields.status.options.cancelled'),
      value: MembershipStatusType.Cancelled
    },
    {
      label: t('fields.status.options.delayed'),
      value: MembershipStatusType.Delayed
    },
    {
      label: t('fields.status.options.paused'),
      value: MembershipStatusType.Paused
    }
  ]

  const createMembership = useMutation(
    trpc.protected.memberships.create.mutationOptions()
  )

  const form = useForm({
    defaultValues: CreateMembershipFormDefaultValues,
    onSubmit: ({ value }) => {
      createMembership.mutate(
        {
          customerEmail: value.customerEmail,
          customerName: value.customerName || undefined,
          delayedStartDate: value.delayedStartDate?.toISOString() ?? null,
          endDate: value.endDate.toISOString(),
          parentOrderId: value.parentOrderId || null,
          productName: value.productName,
          startDate: value.startDate.toISOString(),
          status: value.status
        },
        {
          onError: (error) => {
            toast.error(t('toast.error.title'), {
              className: '!text-destructive-foreground',
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-destructive',
                title: '!text-destructive'
              },
              description:
                error instanceof Error
                  ? error.message
                  : t('toast.error.description')
            })
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.memberships.findAll.queryKey()
            })
            toast.success(t('toast.success.title'), {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t('toast.success.description')
            })
            handleOnOpenChange(false)
          }
        }
      )
    },
    validators: {
      onSubmit: CreateMembershipFormSchema
    }
  })

  const statusValue = useStore(form.store, (state) => state.values.status)

  const isPending = createMembership.isPending
  const isProductsLoading = getProducts.isLoading

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      createMembership.reset()
      setStartCalendarOpen(false)
      setEndCalendarOpen(false)
      setDelayedCalendarOpen(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-y-auto p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form className='space-y-6 p-6' id={formId} onSubmit={handleOnSubmit}>
          {/* Customer Info Section */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              {t('sections.customer')}
            </h3>
            <FieldGroup>
              {/* Customer Email */}
              <form.Field name='customerEmail'>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  const isDisabled = isPending

                  return (
                    <Field
                      aria-disabled={isDisabled}
                      data-disabled={isDisabled}
                      data-invalid={isInvalid}
                    >
                      <FieldLabel htmlFor={field.name}>
                        {t('fields.customer-email.label')}
                      </FieldLabel>

                      <InputGroup
                        aria-disabled={isDisabled}
                        aria-invalid={isInvalid}
                        className={cn({ 'opacity-50': isDisabled })}
                        data-disabled={isDisabled}
                      >
                        <InputGroupInput
                          aria-disabled={isDisabled}
                          aria-invalid={isInvalid}
                          disabled={isDisabled}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t('fields.customer-email.placeholder')}
                          type='email'
                          value={field.state.value}
                        />
                        <InputGroupAddon align='inline-start'>
                          <Mail className='group-has-aria-invalid/input-group:text-destructive' />
                        </InputGroupAddon>
                      </InputGroup>

                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Customer Name */}
              <form.Field name='customerName'>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  const isDisabled = isPending

                  return (
                    <Field
                      aria-disabled={isDisabled}
                      data-disabled={isDisabled}
                      data-invalid={isInvalid}
                    >
                      <FieldLabel htmlFor={field.name}>
                        {t('fields.customer-name.label')}
                      </FieldLabel>

                      <InputGroup
                        aria-disabled={isDisabled}
                        aria-invalid={isInvalid}
                        className={cn({ 'opacity-50': isDisabled })}
                        data-disabled={isDisabled}
                      >
                        <InputGroupInput
                          aria-disabled={isDisabled}
                          aria-invalid={isInvalid}
                          disabled={isDisabled}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t('fields.customer-name.placeholder')}
                          type='text'
                          value={field.state.value}
                        />
                        <InputGroupAddon align='inline-start'>
                          <User className='group-has-aria-invalid/input-group:text-destructive' />
                        </InputGroupAddon>
                      </InputGroup>

                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </div>

          {/* Product Details Section */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              {t('sections.product')}
            </h3>
            <FieldGroup>
              {/* Product Name */}
              <form.Field name='productName'>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  const isDisabled = isPending || isProductsLoading

                  return (
                    <Field
                      aria-disabled={isDisabled}
                      data-disabled={isDisabled}
                      data-invalid={isInvalid}
                    >
                      <FieldLabel htmlFor={field.name}>
                        {t('fields.product-name.label')}
                      </FieldLabel>

                      <Select
                        disabled={isDisabled}
                        onValueChange={(value) => field.handleChange(value)}
                        value={field.state.value}
                      >
                        <SelectTrigger
                          className={cn({ 'opacity-50': isDisabled })}
                          id={field.name}
                        >
                          {isProductsLoading ? (
                            <Spinner className='size-4' />
                          ) : (
                            <SelectValue
                              placeholder={t('fields.product-name.placeholder')}
                            />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {getProducts.data?.map((product) => (
                            <SelectItem key={product.id} value={product.name}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </div>

          {/* Status & Dates Section */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              {t('sections.dates')}
            </h3>
            <FieldGroup>
              {/* Status */}
              <form.Field name='status'>
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  const isDisabled = isPending

                  return (
                    <Field
                      aria-disabled={isDisabled}
                      data-disabled={isDisabled}
                      data-invalid={isInvalid}
                    >
                      <FieldLabel htmlFor={field.name}>
                        {t('fields.status.label')}
                      </FieldLabel>

                      <Select
                        disabled={isDisabled}
                        onValueChange={(value) =>
                          field.handleChange(value as MembershipStatusType)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger
                          className={cn({ 'opacity-50': isDisabled })}
                          id={field.name}
                        >
                          <SelectValue
                            placeholder={t('fields.status.placeholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {/* Dates Grid */}
              <div className='grid gap-4 sm:grid-cols-2'>
                {/* Start Date */}
                <form.Field name='startDate'>
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    const isDisabled = isPending

                    const handleOnSelect = (date: Date | undefined) => {
                      if (date) {
                        field.handleChange(date)
                      }
                    }

                    return (
                      <Field
                        aria-disabled={isDisabled}
                        data-disabled={isDisabled}
                        data-invalid={isInvalid}
                      >
                        <FieldLabel htmlFor={field.name}>
                          {t('fields.start-date.label')}
                        </FieldLabel>

                        <Popover
                          onOpenChange={setStartCalendarOpen}
                          open={startCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              aria-disabled={isDisabled}
                              aria-invalid={isInvalid}
                              className={cn({
                                'cursor-not-allowed': isDisabled
                              })}
                              data-disabled={isDisabled}
                              disabled={isDisabled}
                              id={field.name}
                              variant='outline'
                            >
                              <CalendarPlus />
                              {field.state.value
                                ? format(field.state.value, 'PPP', {
                                    locale: ro
                                  })
                                : t('fields.start-date.placeholder')}
                              <ChevronDown className='ml-auto' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align='start'
                            className='max-w-(--radix-popover-trigger-width)'
                          >
                            <Calendar
                              captionLayout='label'
                              className='w-full capitalize'
                              defaultMonth={field.state.value}
                              locale={ro}
                              mode='single'
                              onSelect={handleOnSelect}
                              selected={field.state.value}
                            />
                          </PopoverContent>
                        </Popover>

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                {/* End Date */}
                <form.Field name='endDate'>
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    const isDisabled = isPending

                    const handleOnSelect = (date: Date | undefined) => {
                      if (date) {
                        field.handleChange(date)
                      }
                    }

                    return (
                      <Field
                        aria-disabled={isDisabled}
                        data-disabled={isDisabled}
                        data-invalid={isInvalid}
                      >
                        <FieldLabel htmlFor={field.name}>
                          {t('fields.end-date.label')}
                        </FieldLabel>

                        <Popover
                          onOpenChange={setEndCalendarOpen}
                          open={endCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              aria-disabled={isDisabled}
                              aria-invalid={isInvalid}
                              className={cn({
                                'cursor-not-allowed': isDisabled
                              })}
                              data-disabled={isDisabled}
                              disabled={isDisabled}
                              id={field.name}
                              variant='outline'
                            >
                              <CalendarPlus />
                              {field.state.value
                                ? format(field.state.value, 'PPP', {
                                    locale: ro
                                  })
                                : t('fields.end-date.placeholder')}
                              <ChevronDown className='ml-auto' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align='start'
                            className='max-w-(--radix-popover-trigger-width)'
                          >
                            <Calendar
                              captionLayout='label'
                              className='w-full capitalize'
                              defaultMonth={field.state.value}
                              locale={ro}
                              mode='single'
                              onSelect={handleOnSelect}
                              selected={field.state.value}
                            />
                          </PopoverContent>
                        </Popover>

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              </div>

              {/* Delayed Start Date - conditional */}
              {statusValue === MembershipStatusType.Delayed && (
                <form.Field name='delayedStartDate'>
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    const isDisabled = isPending

                    const handleOnSelect = (date: Date | undefined) => {
                      if (date) {
                        field.handleChange(date)
                        return
                      }
                      field.handleChange(null)
                    }

                    return (
                      <Field
                        aria-disabled={isDisabled}
                        data-disabled={isDisabled}
                        data-invalid={isInvalid}
                      >
                        <FieldLabel htmlFor={field.name}>
                          {t('fields.delayed-start-date.label')}
                        </FieldLabel>

                        <Popover
                          onOpenChange={setDelayedCalendarOpen}
                          open={delayedCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              aria-disabled={isDisabled}
                              aria-invalid={isInvalid}
                              className={cn({
                                'cursor-not-allowed': isDisabled
                              })}
                              data-disabled={isDisabled}
                              disabled={isDisabled}
                              id={field.name}
                              variant='outline'
                            >
                              <CalendarPlus />
                              {field.state.value
                                ? format(field.state.value, 'PPP', {
                                    locale: ro
                                  })
                                : t('fields.delayed-start-date.placeholder')}
                              <ChevronDown className='ml-auto' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align='start'
                            className='max-w-(--radix-popover-trigger-width)'
                          >
                            <Calendar
                              captionLayout='label'
                              className='w-full capitalize'
                              defaultMonth={field.state.value ?? undefined}
                              locale={ro}
                              mode='single'
                              onSelect={handleOnSelect}
                              selected={field.state.value ?? undefined}
                            />
                          </PopoverContent>
                        </Popover>

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              )}
            </FieldGroup>
          </div>
        </form>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t('buttons.cancel')}
            </Button>
          </DialogClose>

          <Button
            disabled={isPending}
            form={formId}
            type='submit'
            variant='default'
          >
            {isPending ? <Spinner /> : <Plus />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
