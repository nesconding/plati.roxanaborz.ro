'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, LockOpen } from 'lucide-react'
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

interface UnbanUserDialogProps {
  user?: typeof UsersTableValidators.$types.select | null
  onCloseDialog?: () => void
}

export function UnbanUserDialog({ user, onCloseDialog }: UnbanUserDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const unbanUser = useMutation(
    trpc.admin.authentication.unbanUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  if (!user) return null

  function handleOnCloseDialog() {
    onCloseDialog?.()
    unbanUser.reset()
  }

  function handleOnClick() {
    if (!user) return

    unbanUser.mutate(
      { userId: user.id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: trpc.admin.authentication.listUsers.queryKey()
          })
          toast.success(
            t(
              'modules.(app).(admin).users._components.unban-user-dialog.response.success.title'
            ),
            {
              description: t(
                'modules.(app).(admin).users._components.unban-user-dialog.response.success.description'
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
              'modules.(app).(admin).users._components.unban-user-dialog.response.error.title'
            ),
            {
              description:
                error instanceof Error
                  ? error.message
                  : t(
                      'modules.(app).(admin).users._components.unban-user-dialog.response.error.description'
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
                'modules.(app).(admin).users._components.unban-user-dialog.title'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'modules.(app).(admin).users._components.unban-user-dialog.description'
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
                  'modules.(app).(admin).users._components.unban-user-dialog.buttons.cancel'
                )}
              </Button>
            </DialogClose>

            <Button disabled={unbanUser.isPending} onClick={handleOnClick}>
              {unbanUser.isPending ? <Spinner /> : <LockOpen />}
              {unbanUser.isPending
                ? t(
                    'modules.(app).(admin).users._components.unban-user-dialog.buttons.confirm.loading'
                  )
                : t(
                    'modules.(app).(admin).users._components.unban-user-dialog.buttons.confirm.default'
                  )}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
