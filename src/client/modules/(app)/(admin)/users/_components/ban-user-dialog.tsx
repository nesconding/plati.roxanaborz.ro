'use client'

import { useStore } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, CircleX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import z from 'zod'
import { useAppForm } from '~/client/components/form/config'
import { Button } from '~/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/client/components/ui/dialog'
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'

import { useTRPC } from '~/client/trpc/react'
import type { UsersTableValidators } from '~/shared/validation/tables/index'

const inputSchema = z.object({
  banExpireDate: z.iso.datetime().optional(),
  banReason: z.string().optional(),
  userId: z.string()
})

interface BanUserDialogProps {
  user?: typeof UsersTableValidators.$types.select | null
  onCloseDialog?: () => void
}

export function BanUserDialog({ user, onCloseDialog }: BanUserDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const banUser = useMutation(
    trpc.admin.authentication.banUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  const defaultValues: z.infer<typeof inputSchema> = {
    banExpireDate: undefined,
    banReason: '',
    userId: user?.id ?? ''
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      banUser.mutate(value, {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).users._components.ban-user-dialog.response.error.title'
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
                      'modules.(app).(admin).users._components.ban-user-dialog.response.error.description'
                    )
            }
          )
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.admin.authentication.listUsers.queryKey()
          })
          toast.success(
            t(
              'modules.(app).(admin).users._components.ban-user-dialog.response.success.title'
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).users._components.ban-user-dialog.response.success.description'
              )
            }
          )
          banUser.reset()
          formApi.reset()
          onCloseDialog?.()
        }
      })
    },
    validators: {
      onSubmit: inputSchema
    }
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isLoading = banUser.isPending || isSubmitting

  if (!user) return null

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    form.handleSubmit()
  }

  function handleOnCloseDialog() {
    if (isLoading) return
    onCloseDialog?.()
    banUser.reset()
    form.reset()
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={!!user}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('modules.(app).(admin).users._components.ban-user-dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).users._components.ban-user-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <form id={form.formId} onSubmit={handleOnSubmit}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend className='mb-1' variant='label'>
                {user.name}
              </FieldLegend>
              <FieldDescription>{user.email}</FieldDescription>

              <FieldGroup>
                <form.AppField name='banExpireDate'>
                  {(field) => (
                    <field.Date
                      description={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banExpireDate.description'
                      )}
                      isLoading={isLoading}
                      label={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banExpireDate.title'
                      )}
                      placeholder={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banExpireDate.placeholder'
                      )}
                    />
                  )}
                </form.AppField>

                <form.AppField name='banReason'>
                  {(field) => (
                    <field.Textarea
                      description={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banReason.description'
                      )}
                      isLoading={isLoading}
                      label={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banReason.title'
                      )}
                      placeholder={t(
                        'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.fields.banReason.placeholder'
                      )}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={handleOnCloseDialog}
            variant='outline'
          >
            <CircleX />
            {t(
              'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.buttons.cancel'
            )}
          </Button>

          <Button disabled={isLoading} form={form.formId} type='submit'>
            {isLoading ? <Spinner /> : <Ban />}
            {isLoading
              ? t(
                  'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).users._components.ban-user-dialog.ban-user-form.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
