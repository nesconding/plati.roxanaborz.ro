'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

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
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/client/components/ui/field'
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
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { UpdateMembershipStatusFormSchema } from '~/shared/update-membership-status-form/update-membership-status-form-schema'

interface UpdateStatusDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  membershipId: string
  customerName?: string
  currentStatus?: string
}

const formId = 'update-status-dialog-form'

export function UpdateStatusDialog({
  isOpen,
  onCloseDialog,
  membershipId,
  customerName,
  currentStatus
}: UpdateStatusDialogProps) {
  const t = useTranslations(
    'modules.(app).memberships._components.update-status-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

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
    }
  ]

  const updateStatus = useMutation(
    trpc.protected.memberships.updateStatus.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      id: membershipId,
      status: currentStatus as MembershipStatusType
    },
    onSubmit: ({ value }) => {
      updateStatus.mutate(
        { id: value.id, status: value.status },
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
              description: t('toast.success.description', {
                status: value.status
              })
            })
            handleOnOpenChange(false)
          }
        }
      )
    },
    validators: {
      onSubmit: UpdateMembershipStatusFormSchema
    }
  })

  const isPending = updateStatus.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      updateStatus.reset()
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
                          <SelectItem
                            disabled={
                              isDisabled || option.value === currentStatus
                            }
                            key={option.value}
                            value={option.value}
                          >
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
            {isPending ? <Spinner /> : <RefreshCw />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
