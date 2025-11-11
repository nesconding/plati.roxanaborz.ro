'use client'

import { useQuery } from '@tanstack/react-query'
import { PackagePlus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '~/client/components/ui/button'
import { ProductItem } from '~/client/modules/(app)/(admin)/products/_components/product-item'
import { useTRPC } from '~/client/trpc/react'

export function ProductsPageModule() {
  const t = useTranslations()
  const trpc = useTRPC()
  const findAllProducts = useQuery(
    trpc.protected.products.findAll.queryOptions()
  )

  return (
    <div className='grid auto-rows-fr grid-cols-1 gap-4 p-4 sm:grid-cols-[repeat(auto-fill,minmax(theme(container-2xs),1fr))]'>
      {findAllProducts.data?.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}

      <Button asChild className='size-full' size='lg' variant='outline'>
        <Link href='/products/create'>
          <PackagePlus />
          {t('modules.(app).(admin).products.create-product')}
        </Link>
      </Button>
    </div>
  )
}
