'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, CircleX, Mail } from 'lucide-react'
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import {
  TransferMembershipFormDefaultValues,
  TransferMembershipFormSchema,
  type TransferMembershipFormValues
} from '~/shared/transfer-membership-form/transfer-membership-form-schema'

interface TransferMembershipDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  membershipId: string
  customerName?: string
  customerEmail?: string
}

const formId = 'transfer-membership-dialog-form'

export function TransferMembershipDialog({
  isOpen,
  onCloseDialog,
  membershipId,
  customerName,
  customerEmail
}: TransferMembershipDialogProps) {
  const t = useTranslations(
    'modules.(app).memberships._components.transfer-membership-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const transferMembership = useMutation(
    trpc.protected.memberships.transferMembership.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      ...TransferMembershipFormDefaultValues,
      id: membershipId
    },
    onSubmit: ({ value }) => {
      transferMembership.mutate(
        { id: value.id, newEmail: value.newCustomerEmail },
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
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.productSubscriptions.findAll.queryKey()
            })
            await queryClient.invalidateQueries({
              queryKey:
                trpc.protected.extensionsSubscriptions.findAll.queryKey()
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
      onSubmit: TransferMembershipFormSchema
    }
  })

  const isPending = transferMembership.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      transferMembership.reset()
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
            {customerEmail && (
              <div className='rounded-lg bg-muted p-3 text-sm'>
                <span className='font-medium'>{t('current-customer')}</span>{' '}
                <span>{customerEmail}</span>
              </div>
            )}

            <form.Field name='newCustomerEmail'>
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
                      {t('fields.new-customer-email.label')}
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
                        placeholder={t('fields.new-customer-email.placeholder')}
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
            {isPending ? <Spinner /> : <ArrowRightLeft />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
