'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleX, Equal, Trash, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import { toast } from 'sonner'

import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
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
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import { ScrollArea, ScrollBar } from '~/client/components/ui/scroll-area'
import { Spinner } from '~/client/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { cn } from '~/client/lib/utils'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'

interface DeleteProductDialogProps {
  product: TRPCRouterOutput['protected']['products']['findAll'][number]
  isOpen?: boolean
  onClose?: () => void
}
export function DeleteProductDialog({
  isOpen,
  product,
  onClose
}: DeleteProductDialogProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const deleteProduct = useMutation(
    trpc.admin.products.deleteOne.mutationOptions()
  )

  const isLoading = deleteProduct.isPending

  function handleOnConfirm() {
    deleteProduct.mutate(product, {
      onError: (error) => {
        console.error(error)
        toast.error(
          t(
            'modules.(app).(admin).products._components.delete-product-dialog.response.error.title'
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
                    'modules.(app).(admin).products._components.delete-product-dialog.response.error.description'
                  )
          }
        )
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.protected.products.findAll.queryKey()
        })
        toast.success(
          t(
            'modules.(app).(admin).products._components.delete-product-dialog.response.success.title'
          ),
          {
            classNames: {
              description: '!text-muted-foreground',
              icon: 'text-primary'
            },
            description: t(
              'modules.(app).(admin).products._components.delete-product-dialog.response.success.description'
            )
          }
        )
        handleOnOpenChange()
      }
    })
  }

  function handleOnOpenChange() {
    if (isLoading) return
    onClose?.()
    deleteProduct.reset()
  }

  if (!product) return null

  return (
    <Dialog onOpenChange={handleOnOpenChange} open={isOpen}>
      <DialogContent className='w-full gap-0 p-0'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            {t(
              'modules.(app).(admin).products._components.delete-product-dialog.title',
              {
                name: product.name
              }
            )}
          </DialogTitle>
          <DialogDescription>
            {t.rich(
              'modules.(app).(admin).products._components.delete-product-dialog.description',
              {
                name: product.name,
                'product-name': (chunks) => (
                  <span className='font-semibold'>{chunks}</span>
                )
              }
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea
          className={cn(
            'w-full',
            'max-h-[calc(100svh-theme(spacing.8)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(var(--text-sm)*(1.25/0.875))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.2)-theme(spacing.9)-theme(spacing.6)-theme(spacing.8))]',
            'sm:max-h-[calc(100svh-theme(spacing.8)-theme(spacing.6)-var(--text-lg)-theme(spacing.2)-(var(--text-sm)*(1.25/0.875))-theme(spacing.6)-1px-1px-theme(spacing.6)-theme(spacing.9)-theme(spacing.6)-theme(spacing.8))]'
          )}
        >
          <FieldGroup className='p-6'>
            <Card className='border-none bg-transparent p-0 shadow-none'>
              <CardHeader className='p-0'>
                <CardTitle>
                  {t(
                    'modules.(app).(admin).products._components.delete-product-dialog.product-details.title'
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className='flex flex-col gap-6 p-0'>
                <div className='grid auto-cols-auto grid-flow-col gap-6 text-sm font-medium max-md:grid-rows-2'>
                  <div className='flex flex-col gap-2'>
                    <p>
                      {t(
                        'modules.(app).(admin).products._components.delete-product-dialog.product-details.name'
                      )}
                    </p>
                    <p className='text-muted-foreground'>{product.name}</p>
                  </div>

                  <div className='flex w-fit flex-col gap-2'>
                    <p className='text-left'>
                      {t(
                        'modules.(app).(admin).products._components.delete-product-dialog.product-details.membershipDurationMonths'
                      )}
                    </p>
                    <p className='text-muted-foreground md:text-center'>
                      {product.membershipDurationMonths}
                    </p>
                  </div>

                  <div className='flex flex-col items-end gap-2'>
                    <p className='text-right'>
                      {t(
                        'modules.(app).(admin).products._components.delete-product-dialog.product-details.minDepositAmount'
                      )}
                    </p>
                    <Tooltip>
                      <TooltipTrigger className='text-right font-medium underline'>
                        <p className='text-muted-foreground text-right'>
                          {PricingService.formatPrice(
                            product.minDepositAmount,
                            'EUR'
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>{`${product.minDepositAmount} €`}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className='flex flex-col items-end gap-2'>
                    <p className='text-right'>
                      {t(
                        'modules.(app).(admin).products._components.delete-product-dialog.product-details.price'
                      )}
                    </p>
                    <Tooltip>
                      <TooltipTrigger className='text-right font-medium underline'>
                        <p className='text-muted-foreground text-right'>
                          {PricingService.formatPrice(product.price, 'EUR')}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>{`${product.price} €`}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            {product.installments.length > 0 && (
              <Card className='border-none bg-transparent p-0 shadow-none'>
                <CardHeader className='p-0'>
                  <CardTitle>
                    {t(
                      'modules.(app).(admin).products._components.delete-product-dialog.installments.title'
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className='p-0'>
                  <FieldGroup>
                    <ScrollArea className='rounded-lg border'>
                      <div className='grid grid-cols-[auto_1fr_auto_1fr_auto]'>
                        <div className='text-muted-foreground col-span-5 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                          <div>
                            {t(
                              'modules.(app).(admin).products._components.delete-product-dialog.installments.count'
                            )}
                          </div>
                          <div />
                          <div className='text-right'>
                            {t(
                              'modules.(app).(admin).products._components.delete-product-dialog.installments.pricePerInstallment'
                            )}
                          </div>
                          <div />
                          <div className='text-right'>
                            {t(
                              'modules.(app).(admin).products._components.delete-product-dialog.installments.totalPrice'
                            )}
                          </div>
                        </div>

                        {product.installments.map((installment, index) => (
                          <div
                            className={cn(
                              'col-span-5 grid grid-cols-subgrid items-center gap-4 p-4',
                              {
                                'border-b':
                                  index < product.installments.length - 1
                              }
                            )}
                            key={installment.id}
                          >
                            <div>{installment.count}</div>
                            <X className='text-muted-foreground size-3 place-self-center' />

                            <Tooltip>
                              <TooltipTrigger className='text-right font-medium underline'>
                                {PricingService.formatPrice(
                                  installment.pricePerInstallment,
                                  'EUR'
                                )}
                              </TooltipTrigger>
                              <TooltipContent>{`${installment.pricePerInstallment} €`}</TooltipContent>
                            </Tooltip>

                            <Equal className='text-muted-foreground size-3 place-self-center' />

                            <Tooltip>
                              <TooltipTrigger className='text-right font-medium underline'>
                                {PricingService.formatPrice(
                                  PricingService.multiply(
                                    installment.pricePerInstallment,
                                    installment.count
                                  ),
                                  'EUR'
                                )}
                              </TooltipTrigger>
                              <TooltipContent className='flex items-center gap-1'>
                                <p>{installment.count}</p>
                                <X className='size-3' />
                                <p>{`${installment.pricePerInstallment} €`}</p>
                                <Equal className='size-3' />
                                <p>
                                  {`${PricingService.multiply(
                                    installment.pricePerInstallment,
                                    installment.count
                                  ).toString()} €`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation='horizontal' />
                    </ScrollArea>
                  </FieldGroup>
                </CardContent>
              </Card>
            )}

            {product.extensions.length > 0 && (
              <Card className='border-none bg-transparent p-0 shadow-none'>
                <CardHeader className='p-0'>
                  <CardTitle>
                    {t(
                      'modules.(app).(admin).products._components.delete-product-dialog.extensions.title'
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className='p-0'>
                  <FieldGroup>
                    {product.extensions.map((extension, index) => (
                      <Fragment key={extension.id}>
                        <div className='flex flex-col gap-6 rounded-lg'>
                          <div className='text-sm font-semibold'>
                            {t(
                              'modules.(app).(admin).products._components.delete-product-dialog.extensions.fields.legend',
                              {
                                number: index + 1
                              }
                            )}
                          </div>

                          <div className='flex justify-between gap-6 text-sm font-medium'>
                            <div className='flex flex-col gap-2'>
                              <p>
                                {t(
                                  'modules.(app).(admin).products._components.delete-product-dialog.extensions.fields.extensionMonths'
                                )}
                              </p>
                              <p className='text-center'>
                                {extension.extensionMonths}
                              </p>
                            </div>

                            <div className='flex flex-col items-end gap-2'>
                              <p className='text-right'>
                                {t(
                                  'modules.(app).(admin).products._components.delete-product-dialog.extensions.fields.minDepositAmount'
                                )}
                              </p>
                              <Tooltip>
                                <TooltipTrigger className='text-right font-medium underline'>
                                  <p className='text-center'>
                                    {PricingService.formatPrice(
                                      extension.minDepositAmount,
                                      'EUR'
                                    )}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>{`${extension.minDepositAmount} €`}</TooltipContent>
                              </Tooltip>
                            </div>

                            <div className='flex flex-col items-end gap-2'>
                              <p className='text-right'>
                                {t(
                                  'modules.(app).(admin).products._components.delete-product-dialog.extensions.fields.price'
                                )}
                              </p>
                              <Tooltip>
                                <TooltipTrigger className='text-right font-medium underline'>
                                  <p className='text-center'>
                                    {PricingService.formatPrice(
                                      extension.price,
                                      'EUR'
                                    )}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>{`${extension.price} €`}</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          {extension.installments.length > 0 && (
                            <FieldSet>
                              <FieldLegend variant='label'>
                                {t(
                                  'modules.(app).(admin).products._components.delete-product-dialog.extensions.installments.title'
                                )}
                              </FieldLegend>

                              <FieldGroup>
                                <ScrollArea className='rounded-lg border'>
                                  <div className='grid grid-cols-[auto_1fr_auto_1fr_auto]'>
                                    <div className='text-muted-foreground col-span-5 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                                      <div>
                                        {t(
                                          'modules.(app).(admin).products._components.delete-product-dialog.extensions.installments.fields.count'
                                        )}
                                      </div>
                                      <div />
                                      <div className='text-right'>
                                        {t(
                                          'modules.(app).(admin).products._components.delete-product-dialog.extensions.installments.fields.pricePerInstallment'
                                        )}
                                      </div>
                                      <div />
                                      <div className='text-right'>
                                        {t(
                                          'modules.(app).(admin).products._components.delete-product-dialog.extensions.installments.fields.totalPrice'
                                        )}
                                      </div>
                                    </div>

                                    {extension.installments.map(
                                      (installment, index) => (
                                        <div
                                          className={cn(
                                            'col-span-5 grid grid-cols-subgrid items-center gap-4 p-4',
                                            {
                                              'border-b':
                                                index <
                                                extension.installments.length -
                                                  1
                                            }
                                          )}
                                          key={installment.id}
                                        >
                                          <div>{installment.count}</div>
                                          <X className='text-muted-foreground size-3 place-self-center' />

                                          <Tooltip>
                                            <TooltipTrigger className='text-right font-medium underline'>
                                              {PricingService.formatPrice(
                                                installment.pricePerInstallment,
                                                'EUR'
                                              )}
                                            </TooltipTrigger>
                                            <TooltipContent>{`${installment.pricePerInstallment} €`}</TooltipContent>
                                          </Tooltip>

                                          <Equal className='text-muted-foreground size-3 place-self-center' />

                                          <Tooltip>
                                            <TooltipTrigger className='text-right font-medium underline'>
                                              {PricingService.formatPrice(
                                                PricingService.multiply(
                                                  installment.pricePerInstallment,
                                                  installment.count
                                                ),
                                                'EUR'
                                              )}
                                            </TooltipTrigger>
                                            <TooltipContent className='flex items-center gap-1'>
                                              <p>{installment.count}</p>
                                              <X className='size-3' />
                                              <p>{`${installment.pricePerInstallment} €`}</p>
                                              <Equal className='size-3' />
                                              <p>
                                                {`${PricingService.multiply(
                                                  installment.pricePerInstallment,
                                                  installment.count
                                                ).toString()} €`}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      )
                                    )}
                                  </div>
                                  <ScrollBar orientation='horizontal' />
                                </ScrollArea>
                              </FieldGroup>
                            </FieldSet>
                          )}
                        </div>

                        {index < product.extensions.length - 1 && (
                          <FieldSeparator />
                        )}
                      </Fragment>
                    ))}
                  </FieldGroup>
                </CardContent>
              </Card>
            )}
          </FieldGroup>
        </ScrollArea>

        <DialogFooter className='border-t p-6'>
          <Button
            asChild
            disabled={isLoading}
            onClick={handleOnOpenChange}
            variant='outline'
          >
            <DialogClose>
              <CircleX />
              {t(
                'modules.(app).(admin).products._components.delete-product-dialog.buttons.cancel'
              )}
            </DialogClose>
          </Button>

          <Button
            disabled={isLoading}
            onClick={handleOnConfirm}
            variant='destructive'
          >
            {isLoading ? <Spinner /> : <Trash />}
            {isLoading
              ? t(
                  'modules.(app).(admin).products._components.delete-product-dialog.buttons.confirm.loading'
                )
              : t(
                  'modules.(app).(admin).products._components.delete-product-dialog.buttons.confirm.default'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
