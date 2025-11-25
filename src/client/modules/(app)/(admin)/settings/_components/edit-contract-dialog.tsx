'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, FileText, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { toast } from 'sonner'
import z from 'zod'

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
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]

interface EditContractDialogProps {
  contract: Contract | null
  isOpen?: boolean
  onClose?: () => void
}

const formId = 'edit-contract-dialog-form'

namespace EditContractDialogValidator {
  export const schema = z.object({
    name: z.string().min(1)
  })
  export type Input = z.infer<typeof schema>
}

export function EditContractDialog({
  contract,
  isOpen,
  onClose
}: EditContractDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const updateContract = useMutation(
    trpc.admin.settings.updateOneContract.mutationOptions()
  )

  const form = useForm({
    defaultValues: {
      name: contract?.name ?? ''
    },
    onSubmit: ({ value }) => {
      if (!contract) return

      updateContract.mutate(
        { id: contract.id, name: value.name },
        {
          onError: (error) => {
            console.error(error)
            toast.error(
              t(
                'modules.(app).(admin).settings.contract-settings.edit-dialog.response.error.title'
              ),
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
                        'modules.(app).(admin).settings.contract-settings.edit-dialog.response.error.description'
                      )
              }
            )
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.contracts.findAll.queryKey()
            })
            toast.success(
              t(
                'modules.(app).(admin).settings.contract-settings.edit-dialog.response.success.title'
              ),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'modules.(app).(admin).settings.contract-settings.edit-dialog.response.success.description'
                )
              }
            )
            handleOnOpenChange(false)
          }
        }
      )
    },
    validators: {
      onSubmit: EditContractDialogValidator.schema
    }
  })

  const isPending = updateContract.isPending

  useEffect(() => {
    if (contract) {
      form.setFieldValue('name', contract.name)
    }
  }, [contract, form])

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onClose?.()
      form.reset()
      updateContract.reset()
    }
  }

  if (!contract) return null

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).settings.contract-settings.edit-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).settings.contract-settings.edit-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-full max-h-[calc(100svh-theme(spacing.24)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(var(--text-sm)*(1.25/0.875))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.2)-theme(spacing.9)-theme(spacing.6))]'>
          <form id={formId} onSubmit={handleOnSubmit}>
            <FieldGroup className='p-6'>
              <form.Field name='name'>
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
                        {t(
                          'modules.(app).(admin).settings.contract-settings.edit-dialog.form.fields.name.label'
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
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t(
                            'modules.(app).(admin).settings.contract-settings.edit-dialog.form.fields.name.placeholder'
                          )}
                          value={field.state.value}
                        />
                        <InputGroupAddon align='inline-start'>
                          <FileText className='group-has-aria-invalid/input-group:text-destructive' />
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
        </ScrollArea>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t(
                'modules.(app).(admin).settings.contract-settings.edit-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <Button disabled={isPending} form={formId} type='submit'>
            {isPending ? <Spinner /> : <Save />}
            {isPending
              ? t(
                  'modules.(app).(admin).settings.contract-settings.edit-dialog.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).settings.contract-settings.edit-dialog.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
