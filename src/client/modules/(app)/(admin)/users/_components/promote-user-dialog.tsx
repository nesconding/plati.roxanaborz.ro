'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, ShieldPlus } from 'lucide-react'
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
import type { UsersTableValidators } from '~/shared/validation/tables/index'

interface PromoteUserDialogProps {
  user?: typeof UsersTableValidators.$types.select | null
  onCloseDialog?: () => void
}

export function PromoteUserDialog({
  user,
  onCloseDialog
}: PromoteUserDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const promoteUser = useMutation(
    trpc.admin.authentication.promoteUser.mutationOptions()
  )
  const queryClient = useQueryClient()

  if (!user) return null

  function handleOnCloseDialog() {
    onCloseDialog?.()
    promoteUser.reset()
  }

  function handleOnClick() {
    if (!user) return

    promoteUser.mutate(
      { userId: user.id },
      {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).users._components.promote-user-dialog.response.error.title'
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
                      'modules.(app).(admin).users._components.promote-user-dialog.response.error.description'
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
              'modules.(app).(admin).users._components.promote-user-dialog.response.success.title'
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).users._components.promote-user-dialog.response.success.description'
              )
            }
          )
          handleOnCloseDialog?.()
        }
      }
    )
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={!!user}>
      <DialogContent>
        <FieldGroup>
          <DialogHeader>
            <DialogTitle>
              {t(
                'modules.(app).(admin).users._components.promote-user-dialog.title'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'modules.(app).(admin).users._components.promote-user-dialog.description'
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
                  'modules.(app).(admin).users._components.promote-user-dialog.buttons.cancel'
                )}
              </Button>
            </DialogClose>

            <Button disabled={promoteUser.isPending} onClick={handleOnClick}>
              {promoteUser.isPending ? <Spinner /> : <ShieldPlus />}
              {promoteUser.isPending
                ? t(
                    'modules.(app).(admin).users._components.promote-user-dialog.buttons.confirm.loading'
                  )
                : t(
                    'modules.(app).(admin).users._components.promote-user-dialog.buttons.confirm.default'
                  )}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
