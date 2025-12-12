'use client'

import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/client/components/ui/popover'
import { cn } from '~/client/lib/utils'
import { useTRPC } from '~/client/trpc/react'

interface OrderSelectorComboboxProps {
  disabled?: boolean
  onSelect: (orderId: string, orderType: 'product' | 'extension') => void
  selectedOrderId: string | null
}

export function OrderSelectorCombobox({
  disabled,
  onSelect,
  selectedOrderId
}: OrderSelectorComboboxProps) {
  const t = useTranslations('modules.(app).update-bank-transfer.orderSelector')
  const trpc = useTRPC()
  const [open, setOpen] = useState(false)

  const { data: pendingOrders, isLoading } = useQuery(
    trpc.protected.bankTransfers.findPendingOrders.queryOptions()
  )

  const selectedOrder = pendingOrders?.find(
    (order) => order.id === selectedOrderId
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className='w-full justify-between'
          disabled={disabled || isLoading}
          role='combobox'
          variant='outline'
        >
          {selectedOrder ? (
            <div className='flex items-center gap-2'>
              <span className='font-mono text-xs'>
                {selectedOrder.customerName || selectedOrder.customerEmail}
              </span>
              <Badge variant='secondary'>{selectedOrder.productName}</Badge>
            </div>
          ) : (
            t('placeholder')
          )}
          <ChevronsUpDown className='ml-2 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
        <Command>
          <CommandInput placeholder={t('searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('emptyText')}</CommandEmpty>
            <CommandGroup>
              {pendingOrders?.map((order) => (
                <CommandItem
                  key={order.id}
                  onSelect={() => {
                    onSelect(order.id, order.orderType)
                    setOpen(false)
                  }}
                  value={`${order.customerEmail} ${order.customerName} ${order.productName} ${order.id} ${order.type}`}
                >
                  <Check
                    className={cn(
                      'mr-2',
                      selectedOrderId === order.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className='flex flex-col gap-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm'>
                        {order.customerName || order.customerEmail}
                      </span>
                      -<span className='font-medium text-sm'>{order.id}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge className='text-xs' variant='secondary'>
                        {order.productName}
                      </Badge>
                      <Badge className='text-xs' variant='outline'>
                        {order.orderType === 'product'
                          ? 'Produs'
                          : 'Prelungire'}
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
  )
}
