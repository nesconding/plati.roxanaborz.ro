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
import { Spinner } from '~/client/components/ui/spinner'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

type Contract = TRPCRouterOutput['protected']['contracts']['findAll'][number]

interface DeleteContractDialogProps {
  contract: Contract | null
  isOpen?: boolean
  onClose?: () => void
}

export function DeleteContractDialog({
  contract,
  isOpen,
  onClose
}: DeleteContractDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const deleteContract = useMutation(
    trpc.admin.settings.deleteOneContract.mutationOptions()
  )

  const isPending = deleteContract.isPending

  function handleOnConfirm() {
    if (!contract) return

    deleteContract.mutate(
      { id: contract.id },
      {
        onError: (error) => {
          console.error(error)
          toast.error(
            t(
              'modules.(app).(admin).settings.contract-settings.delete-dialog.response.error.title'
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
                      'modules.(app).(admin).settings.contract-settings.delete-dialog.response.error.description'
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
              'modules.(app).(admin).settings.contract-settings.delete-dialog.response.success.title'
            ),
            {
              classNames: {
                description: '!text-muted-foreground',
                icon: 'text-primary'
              },
              description: t(
                'modules.(app).(admin).settings.contract-settings.delete-dialog.response.success.description'
              )
            }
          )
          handleOnOpenChange(false)
        }
      }
    )
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onClose?.()
      deleteContract.reset()
    }
  }

  if (!contract) return null

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).settings.contract-settings.delete-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t.rich(
              'modules.(app).(admin).settings.contract-settings.delete-dialog.description',
              {
                'contract-name': (chunks) => (
                  <span className='font-semibold'>{chunks}</span>
                ),
                name: contract.name
              }
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t(
                'modules.(app).(admin).settings.contract-settings.delete-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <Button
            disabled={isPending}
            onClick={handleOnConfirm}
            variant='destructive'
          >
            {isPending ? <Spinner /> : <Trash />}
            {isPending
              ? t(
                  'modules.(app).(admin).settings.contract-settings.delete-dialog.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).settings.contract-settings.delete-dialog.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
