'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, CircleX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  Alert,
  AlertDescription,
  AlertTitle
} from '~/client/components/ui/alert'
import { Button } from '~/client/components/ui/button'
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
  FieldLabel,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { Label } from '~/client/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/client/components/ui/radio-group'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import {
  CancelSubscriptionFormDefaultValues,
  CancelSubscriptionFormSchema,
  type CancelSubscriptionFormValues
} from '~/shared/cancel-subscription-form/cancel-subscription-form-schema'

interface CancelSubscriptionDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  subscriptionId: string
  subscriptionType: 'product' | 'extension'
  customerName?: string
  nextPaymentDate?: Date | null
}

const formId = 'cancel-subscription-dialog-form'

export function CancelSubscriptionDialog({
  isOpen,
  onCloseDialog,
  subscriptionId,
  subscriptionType,
  customerName,
  nextPaymentDate
}: CancelSubscriptionDialogProps) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.cancel-subscription-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const cancelSubscription = useMutation(
    subscriptionType === 'product'
      ? trpc.protected.productSubscriptions.cancel.mutationOptions()
      : trpc.protected.extensionsSubscriptions.cancel.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      ...CancelSubscriptionFormDefaultValues,
      id: subscriptionId,
      subscriptionType
    },
    onSubmit: ({ value }) => {
      cancelSubscription.mutate(
        { cancelType: value.cancelType, id: value.id },
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
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({
              queryKey:
                subscriptionType === 'product'
                  ? trpc.protected.productSubscriptions.findAll.queryKey()
                  : trpc.protected.extensionsSubscriptions.findAll.queryKey()
            })
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.memberships.findAll.queryKey()
            })
            toast.success(t('toast.success.title'), {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: data.message
            })
            handleOnOpenChange(false)
          }
        }
      )
    },
    validators: {
      onSubmit: CancelSubscriptionFormSchema
    }
  })

  const isPending = cancelSubscription.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      cancelSubscription.reset()
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

        <form id={formId} onSubmit={handleOnSubmit} className='p-6'>
          <FieldGroup>
            <form.Field name='cancelType'>
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                const isDisabled = isPending

                return (
                  <FieldSet
                    aria-disabled={isDisabled}
                    data-disabled={isDisabled}
                    data-invalid={isInvalid}
                  >
                    <FieldLegend>{t('fields.cancel-type.legend')}</FieldLegend>

                    <RadioGroup
                      disabled={isDisabled}
                      onValueChange={(value) =>
                        field.handleChange(value as 'graceful' | 'immediate')
                      }
                      value={field.state.value}
                    >
                      <div className='space-y-4'>
                        <div
                          className={cn(
                            'flex items-start space-x-3 rounded-lg border p-4',
                            {
                              'border-primary bg-primary/5':
                                field.state.value === 'graceful',
                              'opacity-50': isDisabled
                            }
                          )}
                        >
                          <RadioGroupItem
                            value='graceful'
                            id='graceful'
                            className='mt-0.5'
                          />
                          <div className='flex-1'>
                            <Label
                              htmlFor='graceful'
                              className='font-semibold cursor-pointer'
                            >
                              {t('fields.cancel-type.options.graceful.label')}
                            </Label>
                            <FieldDescription className='mt-1'>
                              {nextPaymentDate
                                ? t(
                                    'fields.cancel-type.options.graceful.description',
                                    {
                                      date: new Date(
                                        nextPaymentDate
                                      ).toLocaleDateString('ro-RO', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })
                                    }
                                  )
                                : t(
                                    'fields.cancel-type.options.graceful.description-fallback'
                                  )}
                            </FieldDescription>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'flex items-start space-x-3 rounded-lg border p-4',
                            {
                              'border-primary bg-primary/5':
                                field.state.value === 'immediate',
                              'opacity-50': isDisabled
                            }
                          )}
                        >
                          <RadioGroupItem
                            value='immediate'
                            id='immediate'
                            className='mt-0.5'
                          />
                          <div className='flex-1'>
                            <Label
                              htmlFor='immediate'
                              className='font-semibold cursor-pointer'
                            >
                              {t('fields.cancel-type.options.immediate.label')}
                            </Label>
                            <FieldDescription className='mt-1'>
                              {t(
                                'fields.cancel-type.options.immediate.description'
                              )}
                            </FieldDescription>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                )
              }}
            </form.Field>

            <form.Subscribe>
              {(state) =>
                state.values.cancelType === 'immediate' && (
                  <Alert variant='destructive'>
                    <Ban />
                    <AlertTitle>{t('alert.title')}</AlertTitle>
                    <AlertDescription>
                      {t('alert.description')}
                    </AlertDescription>
                  </Alert>
                )
              }
            </form.Subscribe>
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
            variant='destructive'
          >
            {isPending ? <Spinner /> : <Ban />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
