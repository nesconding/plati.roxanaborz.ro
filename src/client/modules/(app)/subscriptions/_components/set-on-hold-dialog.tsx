'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, Pause } from 'lucide-react'
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

interface SetOnHoldDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  subscriptionId: string
  subscriptionType: 'product' | 'extension'
  customerName?: string
}

export function SetOnHoldDialog({
  isOpen,
  onCloseDialog,
  subscriptionId,
  subscriptionType,
  customerName
}: SetOnHoldDialogProps) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.set-on-hold-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const setOnHold = useMutation(
    subscriptionType === 'product'
      ? trpc.protected.productSubscriptions.setOnHold.mutationOptions()
      : trpc.protected.extensionsSubscriptions.setOnHold.mutationOptions()
  )

  const isPending = setOnHold.isPending

  const handleSetOnHold = () => {
    setOnHold.mutate(
      { id: subscriptionId },
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
          await queryClient.invalidateQueries({
            queryKey:
              subscriptionType === 'product'
                ? trpc.protected.productSubscriptions.findAll.queryKey()
                : trpc.protected.extensionsSubscriptions.findAll.queryKey()
          })
          await queryClient.invalidateQueries({
            queryKey: trpc.protected.memberships.findAll.queryKey()
          })
          toast.success(t('toast.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('toast.success.description')
          })
          handleOnOpenChange(false)
        }
      }
    )
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      setOnHold.reset()
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0' tabIndex={-1}>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {customerName
              ? t('description.with-customer', { customerName })
              : t('description.default')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t('buttons.cancel')}
            </Button>
          </DialogClose>

          <Button
            disabled={isPending}
            onClick={handleSetOnHold}
            type='button'
            variant='default'
          >
            {isPending ? <Spinner /> : <Pause />}
            {isPending
              ? t('buttons.submit.loading')
              : t('buttons.submit.default')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
