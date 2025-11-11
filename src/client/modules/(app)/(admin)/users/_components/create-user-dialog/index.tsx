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
import { CreateUserForm } from '~/client/modules/(app)/(admin)/users/_components/create-user-dialog/create-user-form'
import { useTRPC } from '~/client/trpc/react'
import type { CreateUserSchema } from '~/shared/validation/schemas/user/create-user'

interface CreateUserDialogProps {
  isOpen?: boolean
  onCloseDialog: () => void
}

export function CreateUserDialog({
  isOpen,
  onCloseDialog
}: CreateUserDialogProps) {
  const t = useTranslations()
  const trpc = useTRPC()
  const createUser = useMutation(
    trpc.admin.authentication.createUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  const handleOnSubmit = (value: CreateUserSchema) => {
    createUser.mutate(value, {
      onError: (error) => {
        console.error(error)
        toast.error(
          t(
            'modules.(app).(admin).users._components.create-user-dialog.response.error.title'
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
                    'modules.(app).(admin).users._components.create-user-dialog.response.error.description'
                  )
          }
        )
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.public.authentication.getSession.queryKey()
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.authentication.listUsers.queryKey()
        })
        toast.success(
          t(
            'modules.(app).(admin).users._components.create-user-dialog.response.success.title'
          ),
          {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t(
              'modules.(app).(admin).users._components.create-user-dialog.response.success.description'
            )
          }
        )
        handleOnCloseDialog?.()
      }
    })
  }

  function handleOnCloseDialog() {
    onCloseDialog?.()
    createUser.reset()
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              'modules.(app).(admin).users._components.create-user-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).users._components.create-user-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <CreateUserForm
          isPending={createUser.isPending}
          onCancel={handleOnCloseDialog}
          onSubmit={handleOnSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
