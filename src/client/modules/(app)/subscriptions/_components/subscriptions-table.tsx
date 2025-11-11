'use client'

import { useQuery } from '@tanstack/react-query'
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type HeaderContext,
  type SortingState,
  useReactTable,
  type VisibilityState
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  Search,
  Zap
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Button } from '~/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/client/components/ui/dropdown-menu'
import { Field, FieldGroup } from '~/client/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '~/client/components/ui/input-group'
import { Label } from '~/client/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/client/components/ui/select'
import { Spinner } from '~/client/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/client/components/ui/table'

import { useIsMobile } from '~/client/hooks/use-mobile'
import { cn } from '~/client/lib/utils'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

type Subscription =
  TRPCRouterOutput['protected']['subscriptions']['findAll'][number]

const pageSizeOptions = [10, 25, 50, 75, 100]

interface SubscriptionsTableProps {
  className?: string
}
export function SubscriptionsTable({ className }: SubscriptionsTableProps) {
  const t = useTranslations()

  const isMobile = useIsMobile()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})

  const trpc = useTRPC()
  const getSubscriptions = useQuery(
    trpc.protected.subscriptions.findAll.queryOptions(undefined, {
      initialData: []
    })
  )

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<Subscription>[] = [
    { accessorKey: 'id', header: SubscriptionsTableHeader, id: 'id' },
    { accessorKey: 'status', header: SubscriptionsTableHeader, id: 'status' },
    {
      accessorKey: 'customerName',
      header: SubscriptionsTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'customerEmail',
      header: SubscriptionsTableHeader,
      id: 'customerEmail'
    },
    {
      accessorKey: 'membershipId',
      header: SubscriptionsTableHeader,
      id: 'membershipId'
    },
    {
      accessorKey: 'parentOrderId',
      header: SubscriptionsTableHeader,
      id: 'parentOrderId'
    },
    {
      accessorKey: 'paymentMethod',
      header: SubscriptionsTableHeader,
      id: 'paymentMethod'
    },
    {
      accessorKey: 'nextPaymentDate',
      header: SubscriptionsTableHeader,
      id: 'nextPaymentDate'
    },
    {
      accessorKey: 'remainingPayments',
      header: SubscriptionsTableHeader,
      id: 'remainingPayments'
    },
    {
      accessorKey: 'productId',
      header: SubscriptionsTableHeader,
      id: 'productId'
    },
    {
      accessorKey: 'extensionId',
      header: SubscriptionsTableHeader,
      id: 'extensionId'
    },
    {
      accessorKey: 'startDate',
      header: SubscriptionsTableHeader,
      id: 'startDate'
    },
    {
      accessorKey: 'createdAt',
      header: SubscriptionsTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'updatedAt',
      header: SubscriptionsTableHeader,
      id: 'updatedAt'
    }
  ]

  const table = useReactTable({
    columns,
    data: getSubscriptions.data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
      rowSelection,
      sorting
    }
  })

  const fillRows = Array.from(
    {
      length: Math.max(0, pagination.pageSize - table.getRowModel().rows.length)
    },
    (_, index) => index
  )

  return (
    <FieldGroup className={cn('h-full gap-1.5! lg:gap-3!', className)}>
      <div className='flex w-full flex-col items-center justify-end gap-1.5 sm:flex-row lg:gap-3'>
        <div className='flex w-full items-center justify-end gap-1.5 lg:gap-3'>
          <InputGroup>
            <InputGroupAddon>
              {debouncedSetGlobalFilter.isPending() ? <Spinner /> : <Search />}
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => {
                const value = e.target.value
                setSearchInput(value)
                debouncedSetGlobalFilter(value)
              }}
              placeholder='Caută link de platǎ'
              value={searchInput}
            />
          </InputGroup>
        </div>

        <div className='flex w-full items-center justify-end gap-1.5 sm:w-auto lg:gap-3'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className='max-sm:flex-1 sm:max-lg:size-9'
                variant='outline'
              >
                <Columns2 />
                <span className='sm:hidden lg:block'>
                  {t(
                    'modules.(app).subscriptions._components.subscriptions-table.header.columns.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobile ? 'start' : 'end'}>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map(
                  (column) =>
                    column.id !== 'searchExpiresAt' &&
                    column.id !== 'searchCreatedAt' && (
                      <DropdownMenuCheckboxItem
                        checked={column.getIsVisible()}
                        key={column.id}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {t(
                          `modules.(app).subscriptions._components.subscriptions-table.columns.${column.id}`
                        )}
                      </DropdownMenuCheckboxItem>
                    )
                )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className='max-sm:flex-1 sm:max-lg:size-9'
                variant='outline'
              >
                <Zap />
                <span className='sm:hidden lg:block'>
                  {t(
                    'modules.(app).subscriptions._components.subscriptions-table.header.actions.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuItem disabled>
                <Download />
                {t(
                  'modules.(app).subscriptions._components.subscriptions-table.header.actions.values.download'
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Field className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className='bg-background' key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className=''>
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={cn({
                          'text-center': [
                            'installmentsOption.installments'
                          ].includes(cell.column.id),
                          'text-right': [
                            'amountToPay',
                            'depositAmountInRON'
                          ].includes(cell.column.id)
                        })}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {fillRows.length > 0 &&
                  fillRows.map((_, index) => (
                    <TableRow
                      className='h-14'
                      data-state='false'
                      // biome-ignore lint/suspicious/noArrayIndexKey: <>
                      key={`fill-row-${index}`}
                    />
                  ))}
              </>
            ) : (
              <TableRow>
                <TableCell
                  className='h-24 text-center'
                  colSpan={columns.length}
                >
                  {t(
                    'modules.(app).subscriptions._components.subscriptions-table.no-results'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Field>

      <div className='flex h-fit items-center justify-end gap-1.5 lg:gap-3'>
        <div className='mr-auto text-xs font-medium sm:text-sm'>
          {t(
            'modules.(app).subscriptions._components.subscriptions-table.pagination.page-count',
            {
              page: table.getState().pagination.pageIndex + 1,
              pageCount: table.getPageCount()
            }
          )}
        </div>

        <div className='flex items-center gap-1.5'>
          <Label
            className='text-sm font-medium max-sm:hidden'
            htmlFor='rows-per-page'
          >
            {t(
              'modules.(app).subscriptions._components.subscriptions-table.pagination.rows-per-page'
            )}
          </Label>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger className='w-20' id='rows-per-page' size='sm'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent align='end' side='top'>
              <SelectGroup>
                <SelectLabel className='sm:hidden'>
                  {t(
                    'modules.(app).subscriptions._components.subscriptions-table.pagination.rows-per-page'
                  )}
                </SelectLabel>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button
          className='select-none max-lg:size-8'
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size='sm'
          variant='outline'
        >
          <ChevronLeft />
          <span className='hidden lg:block'>
            {t(
              'modules.(app).subscriptions._components.subscriptions-table.pagination.previous-page'
            )}
          </span>
        </Button>

        <Button
          className='select-none max-lg:size-8'
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size='sm'
          variant='outline'
        >
          <span className='hidden lg:block'>
            {t(
              'modules.(app).subscriptions._components.subscriptions-table.pagination.next-page'
            )}
          </span>
          <ChevronRight />
        </Button>
      </div>
    </FieldGroup>
  )
}

export function SubscriptionsTableHeader({
  column
}: HeaderContext<Subscription, unknown>) {
  const t = useTranslations()

  const handleOnClickColumn = (column: Column<Subscription>) => {
    if (column.getIsSorted() === 'asc') {
      column.toggleSorting(true)
      return
    }

    if (column.getIsSorted() === 'desc') {
      column.clearSorting()
      return
    }

    column.toggleSorting(false)
  }

  return (
    <Button onClick={() => handleOnClickColumn(column)} variant='ghost'>
      {t(
        `modules.(app).subscriptions._components.subscriptions-table.columns.${column.id}`
      )}
      <DynamicIcon
        className={cn('ml-2 h-4 w-4', {
          'rotate-0': column.getIsSorted() === 'asc',
          'rotate-180': column.getIsSorted() === 'desc'
        })}
        name={!column.getIsSorted() ? 'arrow-up-down' : 'arrow-up'}
      />
    </Button>
  )
}
