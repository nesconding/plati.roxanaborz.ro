'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, Trash } from 'lucide-react'
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
import { FieldGroup } from '~/client/components/ui/field'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '~/client/components/ui/item'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import type { UsersTableValidators } from '~/shared/validation/tables/index'

interface RemoveUsersDialogProps {
  users?: (typeof UsersTableValidators.$types.select)[] | null
  onCloseDialog?: () => void
}

export function RemoveUsersDialog({
  users,
  onCloseDialog
}: RemoveUsersDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const removeUsers = useMutation(
    trpc.admin.authentication.removeUsers.mutationOptions()
  )
  const queryClient = useQueryClient()

  if (!users) return null

  function handleOnCloseDialog() {
    onCloseDialog?.()
    removeUsers.reset()
  }

  function handleOnClick() {
    if (!users) return

    removeUsers.mutate(
      { usersIds: users.map((user) => user.id) },
      {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).users._components.remove-users-dialog.response.error.title'
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
                      'modules.(app).(admin).users._components.remove-users-dialog.response.error.description'
                    )
            }
          )
        },
        onSuccess: async ({ data }) => {
          await queryClient.invalidateQueries({
            queryKey: trpc.admin.authentication.listUsers.queryKey()
          })
          toast.success(
            t(
              'modules.(app).(admin).users._components.remove-users-dialog.response.success.title'
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).users._components.remove-users-dialog.response.success.description',
                {
                  count: data.removedCount
                }
              )
            }
          )
          handleOnCloseDialog?.()
        }
      }
    )
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={!!users}>
      <DialogContent className='grid max-h-[calc(100svh-theme(spacing.24))] grid-cols-1 grid-rows-[auto_1fr_auto] gap-0 p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).users._components.remove-users-dialog.title',
              { count: users.length }
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).(admin).users._components.remove-users-dialog.description',
              {
                count: users.length
              }
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea
          className={cn(
            'h-full max-h-[calc(100svh-theme(spacing.24)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(2*(var(--text-sm)*(1.25/0.875)))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.2)-theme(spacing.9)-theme(spacing.6))]',
            'max-h-[calc(100svh-theme(spacing.24)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(2*(var(--text-sm)*(1.25/0.875)))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.6))] md:h-full'
          )}
        >
          <FieldGroup className='px-6 py-7'>
            <FieldGroup>
              {users.map((user) => (
                <Item key={user.id} size='sm' variant='outline'>
                  <ItemContent>
                    <ItemTitle>{user.name}</ItemTitle>
                    <ItemDescription>{user.email}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </FieldGroup>
          </FieldGroup>
        </ScrollArea>

        <DialogFooter className='flex-shrink-0 border-t p-6'>
          <DialogClose asChild>
            <Button variant='outline'>
              <CircleX />
              {t(
                'modules.(app).(admin).users._components.remove-users-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <Button
            disabled={removeUsers.isPending}
            onClick={handleOnClick}
            variant='destructive'
          >
            {removeUsers.isPending ? <Spinner /> : <Trash />}
            {removeUsers.isPending
              ? t(
                  'modules.(app).(admin).users._components.remove-users-dialog.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).users._components.remove-users-dialog.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
