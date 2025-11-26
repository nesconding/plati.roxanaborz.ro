'use client'

import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { CalendarPlus, ChevronDown, CircleX } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import {
  UpdateMembershipDatesFormDefaultValues,
  UpdateMembershipDatesFormSchema
} from '~/shared/update-membership-dates-form/update-membership-dates-form-schema'

interface UpdateDatesDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  membershipId: string
  customerName?: string
  currentStartDate: Date
  currentEndDate: Date
  currentDelayedStartDate: Date | null
}

const formId = 'update-dates-dialog-form'

export function UpdateDatesDialog({
  isOpen,
  onCloseDialog,
  membershipId,
  customerName,
  currentStartDate,
  currentEndDate,
  currentDelayedStartDate
}: UpdateDatesDialogProps) {
  const t = useTranslations(
    'modules.(app).memberships._components.update-dates-dialog'
  )
  const [startCalendarOpen, setStartCalendarOpen] = useState(false)
  const [endCalendarOpen, setEndCalendarOpen] = useState(false)
  const [delayedCalendarOpen, setDelayedCalendarOpen] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateDates = useMutation(
    trpc.protected.memberships.updateDates.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      ...UpdateMembershipDatesFormDefaultValues,
      delayedStartDate: currentDelayedStartDate,
      endDate: currentEndDate,
      id: membershipId,
      startDate: currentStartDate
    },
    onSubmit: ({ value }) => {
      updateDates.mutate(
        {
          delayedStartDate: value.delayedStartDate?.toISOString() || null,
          endDate: value.endDate.toISOString(),
          id: value.id,
          startDate: value.startDate.toISOString()
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
      onSubmit: UpdateMembershipDatesFormSchema
    }
  })

  const { isDefaultValue } = useStore(form.store, (state) => ({
    isDefaultValue: state.isDefaultValue
  }))

  const isPending = updateDates.isPending
  const isDisabled = isPending || isDefaultValue

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      updateDates.reset()
      setStartCalendarOpen(false)
      setEndCalendarOpen(false)
      setDelayedCalendarOpen(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0' tabIndex={-1}>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {customerName
              ? t('description.with-customer', { customerName })
              : t('description.default')}
          </DialogDescription>
        </DialogHeader>

        <form className='p-6' id={formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
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
                          className={cn({ 'cursor-not-allowed': isDisabled })}
                          data-disabled={isDisabled}
                          disabled={isDisabled}
                          id={field.name}
                          variant='outline'
                        >
                          <CalendarPlus />
                          {field.state.value
                            ? format(field.state.value, 'PPP', { locale: ro })
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
                          defaultMonth={currentStartDate}
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
                          className={cn({ 'cursor-not-allowed': isDisabled })}
                          data-disabled={isDisabled}
                          disabled={isDisabled}
                          id={field.name}
                          variant='outline'
                        >
                          <CalendarPlus />
                          {field.state.value
                            ? format(field.state.value, 'PPP', { locale: ro })
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
                          defaultMonth={currentEndDate}
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

            {/* Delayed Start Date */}
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
                          className={cn({ 'cursor-not-allowed': isDisabled })}
                          data-disabled={isDisabled}
                          disabled={isDisabled}
                          id={field.name}
                          variant='outline'
                        >
                          <CalendarPlus />
                          {field.state.value
                            ? format(field.state.value, 'PPP', { locale: ro })
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
                          defaultMonth={currentDelayedStartDate ?? undefined}
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
          </FieldGroup>
        </form>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t('buttons.cancel')}
            </Button>
          </DialogClose>

          <Button
            disabled={isDisabled}
            form={formId}
            type='submit'
            variant='default'
          >
            {isPending ? <Spinner /> : <CalendarPlus />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
