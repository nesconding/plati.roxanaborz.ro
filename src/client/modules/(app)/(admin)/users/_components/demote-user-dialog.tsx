'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, ShieldX } from 'lucide-react'
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
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '~/client/components/ui/field'
import { Spinner } from '~/client/components/ui/spinner'
import { useTRPC } from '~/client/trpc/react'
import { UsersTableValidators } from '~/shared/validation/tables/index'

interface DemoteUserDialogProps {
  user?: typeof UsersTableValidators.$types.select | null
  onCloseDialog?: () => void
}

export function DemoteUserDialog({
  user,
  onCloseDialog
}: DemoteUserDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const demoteUser = useMutation(
    trpc.admin.authentication.demoteUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  if (!user) return null

  function handleOnCloseDialog() {
    onCloseDialog?.()
    demoteUser.reset()
  }

  function handleOnClick() {
    if (!user) return

    demoteUser.mutate(
      { userId: user.id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.admin.authentication.listUsers.queryKey()
          })
          toast.success(
            t(
              'modules.(app).(admin).users._components.demote-user-dialog.response.success.title'
            ),
            {
              description: t(
                'modules.(app).(admin).users._components.demote-user-dialog.response.success.description'
              ),
              classNames: {
                icon: 'text-primary',
                description: '!text-muted-foreground'
              }
            }
          )
          handleOnCloseDialog?.()
        },
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).users._components.demote-user-dialog.response.error.title'
            ),
            {
              description:
                error instanceof Error
                  ? error.message
                  : t(
                      'modules.(app).(admin).users._components.demote-user-dialog.response.error.description'
                    ),
              className: '!text-destructive-foreground',
              classNames: {
                icon: 'text-destructive',
                title: '!text-destructive',
                description: '!text-muted-foreground'
              }
            }
          )
        }
      }
    )
  }

  return (
    <Dialog open={!!user} onOpenChange={handleOnCloseDialog}>
      <DialogContent>
        <FieldGroup>
          <DialogHeader>
            <DialogTitle>
              {t(
                'modules.(app).(admin).users._components.demote-user-dialog.title'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'modules.(app).(admin).users._components.demote-user-dialog.description'
              )}
            </DialogDescription>
          </DialogHeader>

          <FieldSet>
            <FieldLegend className='mb-1' variant='label'>
              {user.name}
            </FieldLegend>
            <FieldDescription>{user.email}</FieldDescription>
          </FieldSet>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>
                <CircleX />
                {t(
                  'modules.(app).(admin).users._components.demote-user-dialog.buttons.cancel'
                )}
              </Button>
            </DialogClose>

            <Button disabled={demoteUser.isPending} onClick={handleOnClick}>
              {demoteUser.isPending ? <Spinner /> : <ShieldX />}
              {demoteUser.isPending
                ? t(
                    'modules.(app).(admin).users._components.demote-user-dialog.buttons.confirm.loading'
                  )
                : t(
                    'modules.(app).(admin).users._components.demote-user-dialog.buttons.confirm.default'
                  )}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
