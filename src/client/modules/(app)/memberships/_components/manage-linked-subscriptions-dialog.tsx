'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, CircleX, Link2, Unlink, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '~/client/components/ui/badge'
import { Button } from '~/client/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '~/client/components/ui/command'
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { ScrollArea } from '~/client/components/ui/scroll-area'
import { Separator } from '~/client/components/ui/separator'
import { Spinner } from '~/client/components/ui/spinner'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'

interface ManageLinkedSubscriptionsDialogProps {
  isOpen?: boolean
  onCloseDialog?: () => void
  membershipId: string
  customerName?: string
}

export function ManageLinkedSubscriptionsDialog({
  isOpen,
  onCloseDialog,
  membershipId,
  customerName
}: ManageLinkedSubscriptionsDialogProps) {
  const t = useTranslations(
    'modules.(app).memberships._components.manage-linked-subscriptions-dialog'
  )
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')

  // Fetch linked subscriptions
  const { data: linkedData, isLoading: isLoadingLinked } = useQuery(
    trpc.protected.memberships.findLinkedSubscriptions.queryOptions({
      membershipId
    })
  )

  // Fetch available subscriptions
  const { data: availableData, isLoading: isLoadingAvailable } = useQuery(
    trpc.protected.memberships.findAvailableSubscriptions.queryOptions()
  )

  const linkSubscription = useMutation(
    trpc.protected.memberships.linkSubscription.mutationOptions()
  )

  const unlinkSubscription = useMutation(
    trpc.protected.memberships.unlinkSubscription.mutationOptions()
  )

  const isPending = linkSubscription.isPending || unlinkSubscription.isPending

  const handleLinkSubscription = () => {
    if (!selectedSubscriptionId) return

    // Determine subscription type based on which array contains it
    const isProductSubscription = availableData?.productSubscriptions.some(
      (sub) => sub.id.toLowerCase() === selectedSubscriptionId.toLowerCase()
    )
    const subscriptionType = isProductSubscription ? 'product' : 'extension'

    linkSubscription.mutate(
      {
        membershipId,
        subscriptionId: selectedSubscriptionId,
        subscriptionType
      },
      {
        onError: (error) => {
          toast.error(t('toast.link.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('toast.link.error.description')
          })
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey:
              trpc.protected.memberships.findLinkedSubscriptions.queryKey({
                membershipId
              })
          })
          await queryClient.invalidateQueries({
            queryKey:
              trpc.protected.memberships.findAvailableSubscriptions.queryKey()
          })
          toast.success(t('toast.link.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('toast.link.success.description')
          })
          setSelectedSubscriptionId('')
        }
      }
    )
  }

  const handleUnlinkSubscription = (
    subscriptionId: string,
    subscriptionType: 'product' | 'extension'
  ) => {
    unlinkSubscription.mutate(
      {
        subscriptionId,
        subscriptionType
      },
      {
        onError: (error) => {
          toast.error(t('toast.unlink.error.title'), {
            className: '!text-destructive-foreground',
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-destructive',
              title: '!text-destructive'
            },
            description:
              error instanceof Error
                ? error.message
                : t('toast.unlink.error.description')
          })
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey:
              trpc.protected.memberships.findLinkedSubscriptions.queryKey({
                membershipId
              })
          })
          await queryClient.invalidateQueries({
            queryKey:
              trpc.protected.memberships.findAvailableSubscriptions.queryKey()
          })
          toast.success(t('toast.unlink.success.title'), {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t('toast.unlink.success.description')
          })
        }
      }
    )
  }

  function handleOnOpenChange(open: boolean) {
    if (isPending) return
    if (!open) {
      onCloseDialog?.()
      setSelectedSubscriptionId('')
      setComboboxOpen(false)
    }
  }

  // Combine all available subscriptions for the combobox
  const allAvailableSubscriptions = [
    ...(availableData?.productSubscriptions.map((sub) => ({
      ...sub,
      type: 'product' as const
    })) || []),
    ...(availableData?.extensionSubscriptions.map((sub) => ({
      ...sub,
      type: 'extension' as const
    })) || [])
  ]

  const hasLinkedSubscriptions =
    (linkedData?.productSubscriptions.length || 0) > 0 ||
    (linkedData?.extensionSubscriptions.length || 0) > 0

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='max-w-2xl gap-0 p-0' tabIndex={-1}>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {customerName
              ? t('description.with-customer', { customerName })
              : t('description.default')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[60vh] p-6'>
          {/* Currently Linked Subscriptions Section */}
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold text-sm'>
                {t('sections.linked.title')}
              </h3>
            </div>

            {isLoadingLinked ? (
              <div className='flex items-center justify-center py-8'>
                <Spinner />
              </div>
            ) : !hasLinkedSubscriptions ? (
              <div className='rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm'>
                {t('sections.linked.empty')}
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Product Subscriptions */}
                {linkedData?.productSubscriptions &&
                  linkedData.productSubscriptions.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='font-medium text-sm'>
                        {t('sections.linked.product-subscriptions')}
                      </h4>
                      <div className='space-y-2'>
                        {linkedData.productSubscriptions.map((subscription) => (
                          <div
                            className='flex items-center justify-between rounded-lg border p-3'
                            key={subscription.id}
                          >
                            <div className='flex flex-col gap-1'>
                              <span className='font-mono text-xs'>
                                {t('subscription-item.id', {
                                  id: subscription.id
                                })}
                              </span>
                              <Badge className='w-fit' variant='outline'>
                                {subscription.status}
                              </Badge>
                            </div>
                            <Button
                              disabled={isPending}
                              onClick={() =>
                                handleUnlinkSubscription(
                                  subscription.id,
                                  'product'
                                )
                              }
                              size='sm'
                              variant='ghost'
                            >
                              <Unlink />
                              {t('buttons.unlink')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Extension Subscriptions */}
                {linkedData?.extensionSubscriptions &&
                  linkedData.extensionSubscriptions.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='font-medium text-sm'>
                        {t('sections.linked.extension-subscriptions')}
                      </h4>
                      <div className='space-y-2'>
                        {linkedData.extensionSubscriptions.map(
                          (subscription) => (
                            <div
                              className='flex items-center justify-between rounded-lg border p-3'
                              key={subscription.id}
                            >
                              <div className='flex flex-col gap-1'>
                                <span className='font-mono text-xs'>
                                  {t('subscription-item.id', {
                                    id: subscription.id
                                  })}
                                </span>
                                <Badge className='w-fit' variant='outline'>
                                  {subscription.status}
                                </Badge>
                              </div>
                              <Button
                                disabled={isPending}
                                onClick={() =>
                                  handleUnlinkSubscription(
                                    subscription.id,
                                    'extension'
                                  )
                                }
                                size='sm'
                                variant='ghost'
                              >
                                <Unlink />
                                {t('buttons.unlink')}
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <Separator className='my-6' />

            {/* Link New Subscription Section */}
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold text-sm'>
                  {t('sections.link-new.title')}
                </h3>
              </div>

              <div className='space-y-4'>
                <Popover onOpenChange={setComboboxOpen} open={comboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      aria-expanded={comboboxOpen}
                      className='w-full justify-between'
                      disabled={isPending || isLoadingAvailable}
                      role='combobox'
                      variant='outline'
                    >
                      {selectedSubscriptionId
                        ? allAvailableSubscriptions.find(
                            (sub) =>
                              sub.id.toLowerCase() ===
                              selectedSubscriptionId.toLowerCase()
                          )?.id
                        : t('fields.subscription-search.placeholder')}
                      <ChevronsUpDown className='ml-2 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
                    <Command>
                      <CommandInput
                        placeholder={t('fields.subscription-search.label')}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t('fields.subscription-search.empty')}
                        </CommandEmpty>
                        <CommandGroup>
                          {allAvailableSubscriptions.map((subscription) => (
                            <CommandItem
                              key={subscription.id}
                              onSelect={() => {
                                // Store the original subscription.id (preserving case)
                                setSelectedSubscriptionId(
                                  selectedSubscriptionId.toLowerCase() ===
                                    subscription.id.toLowerCase()
                                    ? ''
                                    : subscription.id
                                )
                                setComboboxOpen(false)
                              }}
                              value={subscription.id}
                            >
                              <Check
                                className={cn(
                                  'mr-2',
                                  selectedSubscriptionId.toLowerCase() ===
                                    subscription.id.toLowerCase()
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className='flex flex-col gap-1'>
                                <span className='font-mono text-xs'>
                                  {subscription.id}
                                </span>
                                <div className='flex items-center gap-2'>
                                  <Badge
                                    className='text-xs'
                                    variant='secondary'
                                  >
                                    {subscription.type}
                                  </Badge>
                                  <Badge className='text-xs' variant='outline'>
                                    {subscription.status}
                                  </Badge>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  className='w-full'
                  disabled={!selectedSubscriptionId || isPending}
                  onClick={handleLinkSubscription}
                >
                  {isPending ? <Spinner /> : <Link2 />}
                  {t('buttons.link')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className='border-t p-6'>
          <DialogClose asChild>
            <Button disabled={isPending} type='button' variant='outline'>
              <CircleX />
              {t('buttons.cancel')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
