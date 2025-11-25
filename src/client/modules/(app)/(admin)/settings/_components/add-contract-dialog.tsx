'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, FileText, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'

import { PDFDropzone } from '~/client/components/pdf-dropzone'
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
import { useTRPC } from '~/client/trpc/react'

interface AddContractDialogProps {
  isOpen?: boolean
  onClose?: () => void
}

const formId = 'add-contract-dialog-form'

namespace AddContractDialogValidator {
  export const schema = z.object({
    file: z.instanceof(File),
    name: z.string().min(1)
  })
  export type Input = z.infer<typeof schema>
}

const defaultValues: Partial<AddContractDialogValidator.Input> = {
  file: undefined,
  name: ''
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
  })
}

export function AddContractDialog({ isOpen, onClose }: AddContractDialogProps) {
  const t = useTranslations()
  const [hasUserEditedName, setHasUserEditedName] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const createContract = useMutation(
    trpc.admin.settings.createOneContract.mutationOptions()
  )

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!value.file || !value.name) return

      const base64Data = await fileToBase64(value.file)

      createContract.mutate(
        {
          file: {
            data: base64Data,
            originalName: value.file.name
          },
          name: value.name
        },
        {
          onError: (error) => {
            console.error(error)
            toast.error(
              t(
                'modules.(app).(admin).settings.contract-settings.add-dialog.response.error.title'
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
                        'modules.(app).(admin).settings.contract-settings.add-dialog.response.error.description'
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
                'modules.(app).(admin).settings.contract-settings.add-dialog.response.success.title'
              ),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'modules.(app).(admin).settings.contract-settings.add-dialog.response.success.description'
                )
              }
            )
            handleOnOpenChange(false)
          }
        }
      )
    },
    validators: {
      onSubmit: AddContractDialogValidator.schema
    }
  })

  const isPending = createContract.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const handleFileSelect = useCallback(
    (file: File | null) => {
      form.setFieldValue('file', file ?? undefined)

      if (file && !hasUserEditedName) {
        const nameWithoutExtension = file.name.replace(/\.pdf$/i, '')
        form.setFieldValue('name', nameWithoutExtension)
      }
    },
    [form, hasUserEditedName]
  )

  const handleNameChange = useCallback(
    (value: string) => {
      setHasUserEditedName(true)
      form.setFieldValue('name', value)
    },
    [form]
  )

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onClose?.()
      form.reset()
      createContract.reset()
      setHasUserEditedName(false)
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).settings.contract-settings.add-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).settings.contract-settings.add-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-full max-h-[calc(100svh-theme(spacing.24)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(var(--text-sm)*(1.25/0.875))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.2)-theme(spacing.9)-theme(spacing.6))]'>
          <form id={formId} onSubmit={handleOnSubmit}>
            <FieldGroup className='p-6'>
              <form.Field name='file'>
                {(field) => (
                  <PDFDropzone
                    disabled={isPending}
                    file={field.state.value}
                    onFileSelect={handleFileSelect}
                  />
                )}
              </form.Field>

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
                          'modules.(app).(admin).settings.contract-settings.add-dialog.form.fields.name.label'
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
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder={t(
                            'modules.(app).(admin).settings.contract-settings.add-dialog.form.fields.name.placeholder'
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
                'modules.(app).(admin).settings.contract-settings.add-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <Button disabled={isPending} form={formId} type='submit'>
            {isPending ? <Spinner /> : <Plus />}
            {isPending
              ? t(
                  'modules.(app).(admin).settings.contract-settings.add-dialog.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).settings.contract-settings.add-dialog.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
