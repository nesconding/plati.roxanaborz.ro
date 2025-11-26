'use client'

import { useForm } from '@tanstack/react-form'
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
  FieldDescription,
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
  ReschedulePaymentFormDefaultValues,
  ReschedulePaymentFormSchema
} from '~/shared/reschedule-payment-form/reschedule-payment-form-schema'

interface ReschedulePaymentDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  subscriptionId: string
  subscriptionType: 'product' | 'extension'
  customerName?: string
  currentPaymentDate?: Date | null
}

const formId = 'reschedule-payment-dialog-form'

export function ReschedulePaymentDialog({
  isOpen,
  onCloseDialog,
  subscriptionId,
  subscriptionType,
  customerName,
  currentPaymentDate
}: ReschedulePaymentDialogProps) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.reschedule-payment-dialog'
  )
  const [calendarOpen, setCalendarOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const reschedulePayment = useMutation(
    subscriptionType === 'product'
      ? trpc.protected.productSubscriptions.reschedulePayment.mutationOptions()
      : trpc.protected.extensionsSubscriptions.reschedulePayment.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      ...ReschedulePaymentFormDefaultValues,
      id: subscriptionId,
      newPaymentDate: currentPaymentDate ?? undefined,
      subscriptionType
    },
    onSubmit: ({ value }) => {
      reschedulePayment.mutate(
        {
          id: value.id,
          newDate: value.newPaymentDate?.toISOString() ?? ''
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
              queryKey:
                subscriptionType === 'product'
                  ? trpc.protected.productSubscriptions.findAll.queryKey()
                  : trpc.protected.extensionsSubscriptions.findAll.queryKey()
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
      onSubmit: ReschedulePaymentFormSchema
    }
  })

  const isPending = reschedulePayment.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      reschedulePayment.reset()
      setCalendarOpen(false)
    }
  }

  const now = new Date()

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
            <form.Field name='newPaymentDate'>
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
                      {t('fields.new-payment-date.label')}
                    </FieldLabel>
                    <FieldDescription>
                      {currentPaymentDate
                        ? t(
                            'fields.new-payment-date.description.current-date',
                            {
                              date: new Date(
                                currentPaymentDate
                              ).toLocaleDateString('ro-RO', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            }
                          )
                        : t(
                            'fields.new-payment-date.description.select-future'
                          )}
                    </FieldDescription>

                    <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
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
                            : t('fields.new-payment-date.placeholder')}
                          <ChevronDown className='ml-auto' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align='start'>
                        <FieldGroup>
                          <Field>
                            <Calendar
                              aria-disabled={isDisabled}
                              aria-invalid={isInvalid}
                              captionLayout='label'
                              className='w-full capitalize'
                              data-disabled={isDisabled}
                              defaultMonth={currentPaymentDate ?? undefined}
                              disabled={isDisabled || { before: now }}
                              locale={ro}
                              mode='single'
                              onSelect={handleOnSelect}
                              selected={field.state.value}
                              startMonth={now}
                            />
                          </Field>
                        </FieldGroup>
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
            disabled={isPending}
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
