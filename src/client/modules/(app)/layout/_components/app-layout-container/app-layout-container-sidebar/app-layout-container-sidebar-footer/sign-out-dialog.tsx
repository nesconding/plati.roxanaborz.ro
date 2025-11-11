'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

interface SignOutDialogProps {
  isOpen: boolean
  onCloseDialog: () => void
}

export function SignOutDialog({ isOpen, onCloseDialog }: SignOutDialogProps) {
  const t = useTranslations()
  const trpc = useTRPC()
  const router = useRouter()
  const signOut = useMutation(
    trpc.protected.authentication.signOut.mutationOptions()
  )
  const queryClient = useQueryClient()

  const handleOnSubmit = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        console.error(error)
        toast.error(
          t(
            'modules.(app).layout.container.sidebar.footer.sign-out-dialog.response.error.title'
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
                    'modules.(app).layout.container.sidebar.footer.sign-out-dialog.response.error.description'
                  )
          }
        )
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.public.authentication.getSession.queryKey()
        })
        toast.success(
          t(
            'modules.(app).layout.container.sidebar.footer.sign-out-dialog.response.success.title'
          ),
          {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t(
              'modules.(app).layout.container.sidebar.footer.sign-out-dialog.response.success.description'
            )
          }
        )
        handleOnCloseDialog?.()
        router.push('/sign-in')
      }
    })
  }

  function handleOnCloseDialog() {
    onCloseDialog?.()
    signOut.reset()
  }

  return (
    <Dialog onOpenChange={handleOnCloseDialog} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              'modules.(app).layout.container.sidebar.footer.sign-out-dialog.title'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'modules.(app).layout.container.sidebar.footer.sign-out-dialog.description'
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={signOut.isPending} variant='outline'>
              <CircleX />
              {t(
                'modules.(app).layout.container.sidebar.footer.sign-out-dialog.buttons.cancel'
              )}
            </Button>
          </DialogClose>

          <Button
            disabled={signOut.isPending}
            onClick={handleOnSubmit}
            type='submit'
            variant='destructive'
          >
            {signOut.isPending ? <Spinner /> : <LogOut />}
            {signOut.isPending
              ? t(
                  'modules.(app).layout.container.sidebar.footer.sign-out-dialog.buttons.submit.loading'
                )
              : t(
                  'modules.(app).layout.container.sidebar.footer.sign-out-dialog.buttons.submit.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
