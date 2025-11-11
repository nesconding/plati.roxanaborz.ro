'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '~/client/components/ui/dialog'
import { EditUserForm } from '~/client/modules/(app)/(admin)/users/_components/edit-user-dialog/edit-user-form'
import { useTRPC } from '~/client/trpc/react'
import type { UpdateUserSchema } from '~/shared/validation/schemas/user/update-user'
import type { UsersTableValidators } from '~/shared/validation/tables'

interface EditUserDialogProps {
  user?: typeof UsersTableValidators.$types.select | null
  onCloseDialog?: () => void
}

export function EditUserDialog({ user, onCloseDialog }: EditUserDialogProps) {
  const t = useTranslations()
  const trpc = useTRPC()
  const editUser = useMutation(
    trpc.admin.authentication.editUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  if (!user) return null

  const handleOnSubmit = (value: UpdateUserSchema) => {
    editUser.mutate(value, {
      onError: (error) => {
        console.error(error)
        toast.error(
          t(
            'modules.(app).(admin).users._components.edit-user-dialog.response.error.title'
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
                    'modules.(app).(admin).users._components.edit-user-dialog.response.error.description'
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
            'modules.(app).(admin).users._components.edit-user-dialog.response.success.title'
          ),
          {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t(
              'modules.(app).(admin).users._components.edit-user-dialog.response.success.description'
            )
          }
        )
        handleOnCloseDialog?.()
      }
    })
  }

  function handleOnCloseDialog() {
    onCloseDialog?.()
    editUser.reset()
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={!!user}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              'modules.(app).(admin).users._components.edit-user-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).users._components.edit-user-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <EditUserForm
          isPending={editUser.isPending}
          onCancel={handleOnCloseDialog}
          onSubmit={handleOnSubmit}
          user={user}
        />
      </DialogContent>
    </Dialog>
  )
}
