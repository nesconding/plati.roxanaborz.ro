'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/client/components/ui/dialog'

import { useTRPC } from '~/client/trpc/react'
import { UsersTableValidators } from '~/shared/validation/tables'

interface AccountManagementDialogProps {
  user?: typeof UsersTableValidators.$types.select
  isOpen: boolean
  onCloseDialog: () => void
}

import { useStore } from '@tanstack/react-form'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { CircleX, Mail, Save, UserRoundPen } from 'lucide-react'

import z from 'zod'
import { useAppForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import { FieldGroup } from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'

const schema = UsersTableValidators.update.extend({
  email: z.email(),
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  phoneNumber: z.optional(
    z.string().refine((phoneNumber) => isValidPhoneNumber(phoneNumber))
  )
})

export function AccountManagementDialog({
  user,
  isOpen,
  onCloseDialog
}: AccountManagementDialogProps) {
  const t = useTranslations()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const updateUser = useMutation(
    trpc.protected.authentication.updateUser.mutationOptions()
  )

  const defaultValues: z.infer<typeof schema> = {
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phoneNumber: user?.phoneNumber ?? ''
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      updateUser.mutate(value, {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).layout.container.sidebar.footer.account-management-dialog.response.error.title'
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
                      'modules.(app).layout.container.sidebar.footer.account-management-dialog.response.error.description'
                    )
            }
          )
        },
        onSuccess: async ({ verificationEmailSent }) => {
          await queryClient.invalidateQueries({
            queryKey: trpc.public.authentication.getSession.queryKey()
          })
          toast.success(
            t(
              `modules.(app).layout.container.sidebar.footer.account-management-dialog.response.success.title.${verificationEmailSent ? 'email-verification-sent' : 'default'}`
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                `modules.(app).layout.container.sidebar.footer.account-management-dialog.response.success.description.${verificationEmailSent ? 'email-verification-sent' : 'default'}`
              )
            }
          )

          if (verificationEmailSent) {
            onCloseDialog?.()
          }
          updateUser.reset()
          form.reset()
        }
      })
    },
    validators: {
      onSubmit: schema
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isLoading = updateUser.isPending || isSubmitting

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnCloseDialog() {
    if (isLoading) return
    onCloseDialog?.()
    updateUser.reset()
    form.reset()
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              'modules.(app).layout.container.sidebar.footer.account-management-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).layout.container.sidebar.footer.account-management-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <form id={form.formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
            <form.AppField name='email'>
              {(field) => (
                <field.Text
                  addons={[{ icon: Mail }]}
                  description={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.email.description'
                  )}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.email.title'
                  )}
                  placeholder={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.email.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='lastName'>
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.lastName.title'
                  )}
                  placeholder={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.lastName.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='firstName'>
              {(field) => (
                <field.Text
                  addons={[{ icon: UserRoundPen }]}
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.firstName.title'
                  )}
                  placeholder={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.firstName.placeholder'
                  )}
                />
              )}
            </form.AppField>

            <form.AppField name='phoneNumber'>
              {(field) => (
                <field.Phone
                  isLoading={isLoading}
                  label={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.phoneNumber.title'
                  )}
                  placeholder={t(
                    'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.fields.phoneNumber.placeholder'
                  )}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={handleOnCloseDialog}
            type='button'
            variant='outline'
          >
            <CircleX />
            {t(
              'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.buttons.cancel'
            )}
          </Button>

          <form.Subscribe>
            {(state) => (
              <Button
                disabled={isLoading || state.isDefaultValue}
                form={form.formId}
                type='submit'
              >
                {isLoading ? <Spinner /> : <Save />}
                {isLoading
                  ? t(
                      'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.buttons.submit.loading'
                    )
                  : t(
                      'modules.(app).layout.container.sidebar.footer.account-management-dialog.update-user-form.buttons.submit.default'
                    )}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
