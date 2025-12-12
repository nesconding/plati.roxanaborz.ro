'use client'

import { useMutation } from '@tanstack/react-query'
import { Check, CircleX, Copy, CreditCard, Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  Alert,
  AlertDescription,
  AlertTitle
} from '~/client/components/ui/alert'
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
import { Input } from '~/client/components/ui/input'
import { Spinner } from '~/client/components/ui/spinner'
import { useTRPC } from '~/client/trpc/react'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

interface UpdatePaymentMethodDialogProps {
  customerName?: string
  isOpen?: boolean
  onCloseDialog?: () => void
  subscriptionId: string
  subscriptionType: 'product' | 'extension'
}

export function UpdatePaymentMethodDialog({
  customerName,
  isOpen,
  onCloseDialog,
  subscriptionId,
  subscriptionType
}: UpdatePaymentMethodDialogProps) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.update-payment-method-dialog'
  )
  const trpc = useTRPC()

  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateToken = useMutation(
    subscriptionType === 'product'
      ? trpc.protected.productSubscriptions.generateUpdatePaymentToken.mutationOptions()
      : trpc.protected.extensionsSubscriptions.generateUpdatePaymentToken.mutationOptions()
  )

  const isPending = generateToken.isPending

  const type =
    subscriptionType === 'product'
      ? PaymentProductType.Product
      : PaymentProductType.Extension

  const handleGenerateLink = () => {
    generateToken.mutate(
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
        onSuccess: (data) => {
          const link = `${window.location.origin}/update-payment/${subscriptionId}?token=${data.token}&type=${type}`
          setGeneratedLink(link)
          setExpiresAt(data.expiresAt)
          toast.success(t('toast.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('toast.success.description')
          })
        }
      }
    )
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success(t('toast.copied.title'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('toast.copy-error.title'))
    }
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      setGeneratedLink(null)
      setExpiresAt(null)
      setCopied(false)
      generateToken.reset()
    }
  }

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='gap-0 p-0' tabIndex={-1}>
        <DialogHeader className='border-b p-6'>
          <DialogTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {customerName
              ? t('description.with-customer', { customerName })
              : t('description.default')}
          </DialogDescription>
        </DialogHeader>

        <div className='p-6'>
          <FieldGroup>
            {!generatedLink ? (
              <Alert>
                <Link2 className='h-4 w-4' />
                <AlertTitle>{t('info.title')}</AlertTitle>
                <AlertDescription>{t('info.description')}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('link.label')}
                  </label>
                  <div className='flex gap-2'>
                    <Input
                      className='font-mono text-xs'
                      readOnly
                      value={generatedLink}
                    />
                    <Button
                      onClick={handleCopyLink}
                      size='icon'
                      type='button'
                      variant='outline'
                    >
                      {copied ? (
                        <Check className='h-4 w-4' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert variant='default'>
                  <AlertDescription className='text-xs'>
                    {t('link.expires', {
                      date: new Date(expiresAt!).toLocaleString('ro-RO', {
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    })}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </FieldGroup>
        </div>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t('buttons.close')}
            </Button>
          </DialogClose>

          {!generatedLink && (
            <Button
              disabled={isPending}
              onClick={handleGenerateLink}
              type='button'
            >
              {isPending ? <Spinner /> : <Link2 />}
              {isPending
                ? t('buttons.generate.loading')
                : t('buttons.generate.default')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
