'use client'

import { useQuery } from '@tanstack/react-query'
import { Equal, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from '~/client/components/ui/field'
import { ScrollArea, ScrollBar } from '~/client/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'

interface ProductPageModuleProps {
  productId: string
}
export function ProductPageModule({ productId }: ProductPageModuleProps) {
  const t = useTranslations()

  const trpc = useTRPC()
  const findOneProduct = useQuery(
    trpc.protected.products.findOneById.queryOptions({ productId })
  )

  const product = findOneProduct.data
  if (!product) notFound()

  return (
    <FieldGroup className='p-4'>
      <Field
        className='flex items-center gap-2 max-sm:items-start'
        orientation='horizontal'
      >
        <h2 className='mr-auto text-lg font-semibold'>{product.name}</h2>

        <Link href={`/products/${product.id}/edit`} passHref>
          <Button className='max-sm:size-8' size='sm' variant='outline'>
            <Pencil />
            <span className='max-sm:hidden'>
              {t('modules.(app).(admin).products.[productId].edit')}
            </span>
          </Button>
        </Link>
      </Field>

      <Card>
        <CardHeader>
          <CardTitle>
            {t(
              'modules.(app).(admin).products.[productId].product-details.title'
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className='flex flex-col gap-6'>
          <div className='grid auto-cols-auto grid-flow-col gap-6 text-sm font-medium max-md:grid-rows-2'>
            <div className='flex flex-col gap-2'>
              <p>
                {t(
                  'modules.(app).(admin).products.[productId].product-details.name'
                )}
              </p>
              <p className='text-muted-foreground'>{product.name}</p>
            </div>

            <div className='flex w-fit flex-col gap-2'>
              <p className='text-left'>
                {t(
                  'modules.(app).(admin).products.[productId].product-details.membershipDurationMonths'
                )}
              </p>
              <p className='text-muted-foreground md:text-center'>
                {product.membershipDurationMonths}
              </p>
            </div>

            <div className='flex flex-col items-end gap-2'>
              <p className='text-right'>
                {t(
                  'modules.(app).(admin).products.[productId].product-details.minDepositAmount'
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
                  'modules.(app).(admin).products.[productId].product-details.price'
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
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                'modules.(app).(admin).products.[productId].installments.title'
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <ScrollArea className='rounded-lg border'>
                <div className='grid grid-cols-[auto_1fr_auto_1fr_auto]'>
                  <div className='text-muted-foreground col-span-5 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                    <div>
                      {t(
                        'modules.(app).(admin).products.[productId].installments.count'
                      )}
                    </div>
                    <div />
                    <div className='text-right'>
                      {t(
                        'modules.(app).(admin).products.[productId].installments.pricePerInstallment'
                      )}
                    </div>
                    <div />
                    <div className='text-right'>
                      {t(
                        'modules.(app).(admin).products.[productId].installments.totalPrice'
                      )}
                    </div>
                  </div>

                  {product.installments.map((installment, index) => (
                    <div
                      className={cn(
                        'col-span-5 grid grid-cols-subgrid items-center gap-4 p-4',
                        {
                          'border-b': index < product.installments.length - 1
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
        <Card>
          <CardHeader>
            <CardTitle>
              {t('modules.(app).(admin).products.[productId].extensions.title')}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              {product.extensions.map((extension, index) => (
                <Fragment key={extension.id}>
                  <div className='flex flex-col gap-6 rounded-lg'>
                    <div className='text-sm font-semibold'>
                      {t(
                        'modules.(app).(admin).products.[productId].extensions.fields.legend',
                        {
                          number: index + 1
                        }
                      )}
                    </div>

                    <div className='flex justify-between gap-6 text-sm font-medium'>
                      <div className='flex flex-col gap-2'>
                        <p>
                          {t(
                            'modules.(app).(admin).products.[productId].extensions.fields.extensionMonths'
                          )}
                        </p>
                        <p className='md:text-center'>
                          {extension.extensionMonths}
                        </p>
                      </div>

                      <div className='flex flex-col items-end gap-2'>
                        <p className='text-right'>
                          {t(
                            'modules.(app).(admin).products.[productId].extensions.fields.minDepositAmount'
                          )}
                        </p>
                        <Tooltip>
                          <TooltipTrigger className='text-right font-medium underline'>
                            <p className='text-left'>
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
                            'modules.(app).(admin).products.[productId].extensions.fields.price'
                          )}
                        </p>
                        <Tooltip>
                          <TooltipTrigger className='text-right font-medium underline'>
                            <p className='text-left'>
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
                            'modules.(app).(admin).products.[productId].extensions.installments.title'
                          )}
                        </FieldLegend>

                        <FieldGroup>
                          <ScrollArea className='rounded-lg border'>
                            <div className='grid grid-cols-[auto_1fr_auto_1fr_auto]'>
                              <div className='text-muted-foreground col-span-5 grid grid-cols-subgrid gap-4 border-b p-4 text-sm font-medium'>
                                <div>
                                  {t(
                                    'modules.(app).(admin).products.[productId].extensions.installments.fields.count'
                                  )}
                                </div>
                                <div />
                                <div className='text-right'>
                                  {t(
                                    'modules.(app).(admin).products.[productId].extensions.installments.fields.pricePerInstallment'
                                  )}
                                </div>
                                <div />
                                <div className='text-right'>
                                  {t(
                                    'modules.(app).(admin).products.[productId].extensions.installments.fields.totalPrice'
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
                                          extension.installments.length - 1
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

                  {index < product.extensions.length - 1 && <FieldSeparator />}
                </Fragment>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      )}
    </FieldGroup>
  )
}
