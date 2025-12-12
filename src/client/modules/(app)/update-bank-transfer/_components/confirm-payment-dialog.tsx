'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, CircleX } from 'lucide-react'
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
import { useTRPC } from '~/client/trpc/react'

interface ConfirmPaymentDialogProps {
  isOpen: boolean
  onCloseDialog: () => void
  onSuccess: () => void
  orderId: string
  orderType: 'product' | 'extension'
}

export function ConfirmPaymentDialog({
  isOpen,
  onCloseDialog,
  onSuccess,
  orderId,
  orderType
}: ConfirmPaymentDialogProps) {
  const t = useTranslations('modules.(app).update-bank-transfer.confirmDialog')
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const confirmMutation = useMutation(
    trpc.protected.bankTransfers.confirmBankTransfer.mutationOptions()
  )

  const handleConfirm = () => {
    confirmMutation.mutate(
      {
        orderId,
        orderType
      },
      {
        onError: (error) => {
          toast.error(t('toast.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('toast.error.description')
          })
        },
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey:
                trpc.protected.bankTransfers.getOrderDetails.queryOptions({
                  orderId,
                  orderType
                }).queryKey
            }),
            queryClient.invalidateQueries({
              queryKey:
                trpc.protected.bankTransfers.findPendingOrders.queryKey()
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.protected.productSubscriptions.findAll.queryKey()
            }),
            queryClient.invalidateQueries({
              queryKey:
                trpc.protected.extensionsSubscriptions.findAll.queryKey()
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.protected.memberships.findAll.queryKey()
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.protected.productOrders.findAll.queryKey()
            }),
            queryClient.invalidateQueries({
              queryKey: trpc.protected.extensionOrders.findAll.queryKey()
            })
          ])

          toast.success(t('toast.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('toast.success.description')
          })
          onSuccess()
          onCloseDialog()
        }
      }
    )
  }

  function handleOnOpenChange(open: boolean) {
    if (confirmMutation.isPending) return
    if (!open) {
      onCloseDialog()
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button
              disabled={confirmMutation.isPending}
              type='button'
              variant='outline'
            >
              <CircleX />
              {t('buttons.cancel')}
            </Button>
          </DialogClose>
          <Button
            disabled={confirmMutation.isPending}
            onClick={handleConfirm}
            variant='default'
          >
            {confirmMutation.isPending ? <Spinner /> : <CheckCircle />}
            {t('buttons.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
