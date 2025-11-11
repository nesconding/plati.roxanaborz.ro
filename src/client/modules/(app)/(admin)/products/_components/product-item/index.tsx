'use client'

import { useState } from 'react'

import {
  BanknoteArrowDown,
  CalendarClock,
  Coins,
  EllipsisVertical,
  Pencil,
  Trash
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '~/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/client/components/ui/dropdown-menu'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle
} from '~/client/components/ui/item'
import { DeleteProductDialog } from '~/client/modules/(app)/(admin)/products/_components/delete-product-dialog'
import { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'

type Product = TRPCRouterOutput['protected']['products']['findAll'][number]

interface ProductItemProps {
  product: Product
}

export function ProductItem({ product }: ProductItemProps) {
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] =
    useState(false)
  const t = useTranslations()

  const handleOnDeleteProduct: React.MouseEventHandler<HTMLDivElement> = (
    e
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleteProductDialogOpen(true)
  }

  return (
    <>
      <Item variant='outline' asChild>
        <Link href={`/products/${product.id}`} className='relative pr-12'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
                className='absolute top-4 right-4'
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <Link href={`/products/${product.id}/edit`} passHref>
                  <DropdownMenuItem>
                    <Pencil />
                    {t(
                      'modules.(app).(admin).products._components.product-item.buttons.edit-product'
                    )}
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuItem
                  variant='destructive'
                  onClick={handleOnDeleteProduct}
                >
                  <Trash />
                  {t(
                    'modules.(app).(admin).products._components.product-item.buttons.delete-product'
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <ItemHeader>{product.name}</ItemHeader>
          <ItemContent>
            <ItemTitle>
              <Coins className='size-4' />
              {t(
                'modules.(app).(admin).products._components.product-item.price',
                {
                  price: PricingService.formatPrice(product.price, 'EUR')
                }
              )}
            </ItemTitle>
            <ItemDescription className='flex items-center justify-between gap-2'>
              <span className='flex items-center gap-2'>
                <CalendarClock className='size-4' />
                <span>
                  {t(
                    'modules.(app).(admin).products._components.product-item.membershipDurationMonths',
                    {
                      membershipDurationMonths: product.membershipDurationMonths
                    }
                  )}
                </span>
              </span>
            </ItemDescription>

            <ItemDescription>
              <span className='flex items-center gap-2'>
                <BanknoteArrowDown className='size-4' />
                <span>
                  {t(
                    'modules.(app).(admin).products._components.product-item.minDepositAmount',
                    {
                      minDepositAmount: PricingService.formatPrice(
                        product.minDepositAmount,
                        'EUR'
                      )
                    }
                  )}
                </span>
              </span>
            </ItemDescription>
          </ItemContent>
        </Link>
      </Item>

      <DeleteProductDialog
        isOpen={isDeleteProductDialogOpen}
        product={product}
        onClose={() => setIsDeleteProductDialogOpen(false)}
      />
    </>
  )
}
