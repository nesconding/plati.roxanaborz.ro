'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RowValues } from 'exceljs'
import { CircleX, Mail, Upload, UserRoundPen, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { parsePhoneNumber } from 'react-phone-number-input'
import { toast } from 'sonner'
import z from 'zod'

import { FileUploadDropzone } from '~/client/components/file-dropzone'
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
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { PhoneInput } from '~/client/components/ui/phone-input'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { processXLSXData } from '~/client/lib/xlsx'
import { useTRPC } from '~/client/trpc/react'
import { CreateUserSchema } from '~/shared/validation/schemas/user/create-user'

interface ImportUsersDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
}

const formId = 'import-users-dialog-form'

namespace ImportUsersDialogValidator {
  export const schema = z.object({
    filename: z.string(),
    users: z.array(CreateUserSchema).min(1)
  })
  export namespace $types {
    export type input = z.infer<typeof ImportUsersDialogValidator.schema>
    export type output = z.infer<typeof ImportUsersDialogValidator.schema>
  }
}

const defaultValues: ImportUsersDialogValidator.$types.input = {
  filename: '',
  users: [] as {
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
  }[]
}

export function ImportUsersDialog({
  isOpen,
  onCloseDialog
}: ImportUsersDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const importUsers = useMutation(
    trpc.admin.authentication.importUsers.mutationOptions()
  )
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      importUsers.mutate(value.users, {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).users._components.import-users-dialog.response.error.title'
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
                      'modules.(app).(admin).users._components.import-users-dialog.response.error.description'
                    )
            }
          )
        },
        onSuccess: async (data) => {
          await queryClient.invalidateQueries({
            queryKey: trpc.admin.authentication.listUsers.queryKey()
          })
          toast.success(
            t(
              'modules.(app).(admin).users._components.import-users-dialog.response.success.title'
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).users._components.import-users-dialog.response.success.description',
                {
                  count: data.length
                }
              )
            }
          )
          handleOnOpenChange(false)
        }
      })
    },
    validators: {
      onSubmit: ImportUsersDialogValidator.schema
    }
  })

  const isPending = importUsers.isPending

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const handleOnProcess = async (fileName: string, data: RowValues[]) => {
    if (!data) return

    form.setFieldValue('filename', fileName)

    // Define column mapping - matches export-users-dialog format
    const usersData = await processXLSXData(
      data,
      {
        email: t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.email'
        ),
        firstName: t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.firstName'
        ),
        lastName: t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.lastName'
        ),
        phoneNumber: t(
          'modules.(app).(admin).users._components.export-users-dialog.columns.phoneNumber'
        )
      },
      ['firstName', 'lastName', 'email'] // Required fields
    )

    // Set processed users in form - TypeScript knows the shape!
    form.setFieldValue(
      'users',
      usersData.map((user, index) => {
        let formattedPhoneNumber: string | undefined

        if (user.phoneNumber) {
          try {
            const parsed = parsePhoneNumber(user.phoneNumber, 'RO') // Default to Romania
            if (parsed && parsed.isValid()) {
              formattedPhoneNumber = parsed.format('E.164')
            } else {
              console.warn(
                `⚠️ Invalid phone for user ${index + 1}:`,
                user.phoneNumber
              )
            }
          } catch (error) {
            console.error(
              `❌ Error parsing phone for user ${index + 1}:`,
              user.phoneNumber,
              error
            )
          }
        }

        return {
          ...user,
          phoneNumber: formattedPhoneNumber
        }
      })
    )
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      form.reset()
      importUsers.reset()
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0' tabIndex={-1}>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).users._components.import-users-dialog.title'
            )}
          </DialogTitle>

          <form.Subscribe>
            {(state) => (
              <DialogDescription>
                {state.values.filename
                  ? t.rich(
                      'modules.(app).(admin).users._components.import-users-dialog.description-file-selected',
                      {
                        count: state.values.users.length,
                        filename: () => (
                          <span className='font-semibold'>
                            {state.values.filename}
                          </span>
                        )
                      }
                    )
                  : t(
                      'modules.(app).(admin).users._components.import-users-dialog.description-file-not-selected'
                    )}
              </DialogDescription>
            )}
          </form.Subscribe>
        </DialogHeader>

        <ScrollArea className='h-full max-h-[calc(100svh-theme(spacing.24)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(2*(var(--text-sm)*(1.25/0.875)))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.2)-theme(spacing.9)-theme(spacing.6))] md:h-full'>
          <form.Subscribe>
            {(state) =>
              state.values.users.length === 0 ? (
                <div className='p-6'>
                  <FileUploadDropzone onProcess={handleOnProcess} />
                </div>
              ) : (
                <form id={formId} onSubmit={handleOnSubmit}>
                  <form.Field mode='array' name='users'>
                    {(field) => (
                      <FieldGroup className='p-6'>
                        {field.state.value.map((_, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: <>
                          <Fragment key={`import-user-dialog-field-group-${i}`}>
                            <FieldSet>
                              <Field
                                className='items-center justify-between'
                                orientation='horizontal'
                              >
                                <FieldLegend className='mb-0'>
                                  {t(
                                    'modules.(app).(admin).users._components.import-users-dialog.form.legend',
                                    {
                                      index: i + 1
                                    }
                                  )}
                                </FieldLegend>

                                <Button
                                  onClick={() => field.removeValue(i)}
                                  size='icon-sm'
                                  variant='destructive'
                                >
                                  <X />
                                </Button>
                              </Field>

                              <FieldGroup>
                                <form.Field name={`users[${i}].lastName`}>
                                  {(subField) => {
                                    const isInvalid =
                                      subField.state.meta.isTouched &&
                                      !subField.state.meta.isValid
                                    const isDisabled = isPending

                                    return (
                                      <Field
                                        aria-disabled={isDisabled}
                                        data-disabled={isDisabled}
                                        data-invalid={isInvalid}
                                      >
                                        <FieldLabel htmlFor={subField.name}>
                                          {t(
                                            'modules.(app).(admin).users._components.import-users-dialog.form.fields.lastName.label'
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
                                            name={subField.name}
                                            onBlur={subField.handleBlur}
                                            onChange={(e) =>
                                              subField.handleChange(
                                                e.target.value
                                              )
                                            }
                                            placeholder={t(
                                              'modules.(app).(admin).users._components.import-users-dialog.form.fields.lastName.placeholder'
                                            )}
                                            value={subField.state.value}
                                          />
                                          <InputGroupAddon align='inline-start'>
                                            <UserRoundPen className='group-has-aria-invalid/input-group:text-destructive' />
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

                                <form.Field name={`users[${i}].firstName`}>
                                  {(subField) => {
                                    const isInvalid =
                                      subField.state.meta.isTouched &&
                                      !subField.state.meta.isValid
                                    const isDisabled = isPending

                                    return (
                                      <Field
                                        aria-disabled={isDisabled}
                                        data-disabled={isDisabled}
                                        data-invalid={isInvalid}
                                      >
                                        <FieldLabel htmlFor={subField.name}>
                                          {t(
                                            'modules.(app).(admin).users._components.import-users-dialog.form.fields.firstName.label'
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
                                            name={subField.name}
                                            onBlur={subField.handleBlur}
                                            onChange={(e) =>
                                              subField.handleChange(
                                                e.target.value
                                              )
                                            }
                                            placeholder={t(
                                              'modules.(app).(admin).users._components.import-users-dialog.form.fields.firstName.placeholder'
                                            )}
                                            value={subField.state.value}
                                          />
                                          <InputGroupAddon align='inline-start'>
                                            <UserRoundPen className='group-has-aria-invalid/input-group:text-destructive' />
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

                                <form.Field name={`users[${i}].email`}>
                                  {(subField) => {
                                    const isInvalid =
                                      subField.state.meta.isTouched &&
                                      !subField.state.meta.isValid
                                    const isDisabled = isPending

                                    return (
                                      <Field
                                        aria-disabled={isDisabled}
                                        data-disabled={isDisabled}
                                        data-invalid={isInvalid}
                                      >
                                        <FieldLabel htmlFor={subField.name}>
                                          {t(
                                            'modules.(app).(admin).users._components.import-users-dialog.form.fields.email.label'
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
                                            name={subField.name}
                                            onBlur={subField.handleBlur}
                                            onChange={(e) =>
                                              subField.handleChange(
                                                e.target.value
                                              )
                                            }
                                            placeholder={t(
                                              'modules.(app).(admin).users._components.import-users-dialog.form.fields.email.placeholder'
                                            )}
                                            value={subField.state.value}
                                          />
                                          <InputGroupAddon align='inline-start'>
                                            <Mail className='group-has-aria-invalid/input-group:text-destructive' />
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

                                <form.Field name={`users[${i}].phoneNumber`}>
                                  {(subField) => {
                                    const isInvalid =
                                      subField.state.meta.isTouched &&
                                      !subField.state.meta.isValid
                                    const isDisabled = isPending

                                    return (
                                      <Field
                                        aria-disabled={isDisabled}
                                        data-disabled={isDisabled}
                                        data-invalid={isInvalid}
                                      >
                                        <FieldLabel htmlFor={subField.name}>
                                          {t(
                                            'modules.(app).(admin).users._components.import-users-dialog.form.fields.phoneNumber.label'
                                          )}
                                        </FieldLabel>

                                        <PhoneInput
                                          aria-disabled={isDisabled}
                                          aria-invalid={isInvalid}
                                          autoComplete='tel'
                                          className='overflow-ellipsis'
                                          data-disabled={isDisabled}
                                          defaultCountry='RO'
                                          disabled={isDisabled}
                                          id={subField.name}
                                          name={subField.name}
                                          onBlur={subField.handleBlur}
                                          onChange={subField.handleChange}
                                          placeholder={t(
                                            'modules.(app).(admin).users._components.import-users-dialog.form.fields.phoneNumber.placeholder'
                                          )}
                                          value={subField.state.value}
                                        />

                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    )
                                  }}
                                </form.Field>
                              </FieldGroup>
                            </FieldSet>

                            {i < field.state.value.length - 1 && (
                              <FieldSeparator />
                            )}
                          </Fragment>
                        ))}
                      </FieldGroup>
                    )}
                  </form.Field>
                </form>
              )
            }
          </form.Subscribe>
        </ScrollArea>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t(
                'modules.(app).(admin).users._components.import-users-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <form.Subscribe>
            {(state) =>
              state.values.users.length > 0 ? (
                <Button disabled={isPending} form={formId} type='submit'>
                  {isPending ? <Spinner /> : <Upload />}
                  {isPending
                    ? t(
                        'modules.(app).(admin).users._components.import-users-dialog.buttons.confirm.loading'
                      )
                    : t(
                        'modules.(app).(admin).users._components.import-users-dialog.buttons.confirm.default'
                      )}
                </Button>
              ) : null
            }
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
