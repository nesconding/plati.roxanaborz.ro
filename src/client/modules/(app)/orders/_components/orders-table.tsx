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
  // type Row,
  type SortingState,
  useReactTable,
  type VisibilityState
} from '@tanstack/react-table'
import {
  type DateArg,
  format
  // isAfter
} from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  // Copy,
  // CopyCheck,
  Download,
  // Plus,
  Search,
  // View,
  Zap
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
// import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

// import { Badge } from '~/client/components/ui/badge'
import { Button } from '~/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // DropdownMenuGroup,
  DropdownMenuItem,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
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
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger
// } from '~/client/components/ui/tooltip'
import { useIsMobile } from '~/client/hooks/use-mobile'
import { cn } from '~/client/lib/utils'
// import { createXLSXFile } from '~/client/lib/xlsx'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'

// import { PricingService } from '~/lib/pricing'
// import { OrderStatusType } from '~/shared/enums/order-status-type'
// import { UserRoles } from '~/shared/enums/user-roles'

type Order = TRPCRouterOutput['protected']['orders']['findAll'][number]

// const expirationStatusFilter = (
//   row: Row<Order>,
//   columnId: string,
//   filterValue: 'expired' | 'active' | 'all'
// ) => {
//   if (filterValue === 'all') return true

//   const expiresAt = row.getValue(columnId) as Date
//   const isExpired = isAfter(new Date(), expiresAt)

//   if (filterValue === 'expired') return isExpired
//   if (filterValue === 'active') return !isExpired

//   return true
// }

const formatDate = (date: DateArg<Date> & {}) =>
  format(date, 'PPP - HH:mm', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

interface OrdersTableProps {
  className?: string
}
export function OrdersTable({ className }: OrdersTableProps) {
  const t = useTranslations()

  const isMobile = useIsMobile()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  // const [copiedRowId, setCopiedRowId] = useState<string>()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // 'product.name': false,
    // 'installmentsOption.installments': false,
    // depositAmountInRON: false,
    // firstPaymentDateAfterDeposit: false,
    // createdAt: false,
    // id: false
  })
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})

  const trpc = useTRPC()
  const getOrders = useQuery(
    trpc.protected.orders.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  // const getSession = useQuery(
  //   trpc.public.authentication.getSession.queryOptions()
  // )

  const data = useMemo(
    () =>
      getOrders.data.map((order) => ({
        ...order,
        searchCreatedAt: formatDate(order.createdAt)
      })),
    [getOrders.data]
  )

  // const userEmailFilter = (
  //   row: Row<Order>,
  //   columnId: string,
  //   filterValue: 'all' | 'users'
  // ) => {
  //   if (filterValue !== 'users') return true

  //   const createdByEmail = row.getValue(columnId) as string
  //   const isUser = createdByEmail === getSession.data?.user?.email
  //   return isUser
  // }

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<Order>[] = [
    { accessorKey: 'id', header: OrdersTableHeader, id: 'id' },
    {
      accessorKey: 'customerName',
      header: OrdersTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'customerEmail',
      header: OrdersTableHeader,
      id: 'customerEmail'
    },
    { accessorKey: 'status', header: OrdersTableHeader, id: 'status' },
    {
      accessorKey: 'stripePaymentIntentId',
      header: OrdersTableHeader,
      id: 'stripePaymentIntentId'
    },
    { accessorKey: 'type', header: OrdersTableHeader, id: 'type' },
    {
      accessorKey: 'productPaymentLinkId',
      header: OrdersTableHeader,
      id: 'productPaymentLinkId'
    },
    {
      accessorKey: 'extensionPaymentLinkId',
      header: OrdersTableHeader,
      id: 'extensionPaymentLinkId'
    },
    { accessorKey: 'createdAt', header: OrdersTableHeader, id: 'createdAt' },
    { accessorKey: 'updatedAt', header: OrdersTableHeader, id: 'updatedAt' }
  ]

  const table = useReactTable({
    columns,
    data,
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

  function handleOnClickDownload() {
    // const data = table
    //   .getRowModel()
    //   .rows.map((row) => row.original)
    //   .map((row) => ({
    //     [t('modules.(app).orders._components.orders-table.columns.id')]: row.id,
    //     [t('modules.(app).orders._components.orders-table.columns.customerName')]: row.customerName,
    //     [t('modules.(app).orders._components.orders-table.columns.customerEmail')]: row.customerEmail,
    //     [t('modules.(app).orders._components.orders-table.columns.product.name')]: row.product?.name,
    //     [t('modules.(app).orders._components.orders-table.columns.installmentsOption.installments')]:
    //       row.installmentsOption?.installments,
    //     [t('modules.(app).orders._components.orders-table.columns.depositAmountInRON')]:
    //       row.depositAmountInRON,
    //     [t('modules.(app).orders._components.orders-table.columns.firstPaymentDateAfterDeposit')]:
    //       row.firstPaymentDateAfterDeposit ? formatDate(row.firstPaymentDateAfterDeposit) : undefined,
    //     [t('modules.(app).orders._components.orders-table.columns.firstPaymentDateValue')]:
    //       row.firstPaymentDateAfterDeposit,
    //     [t('modules.(app).orders._components.orders-table.columns.amountToPay')]: row.amountToPay,
    //     [t('modules.(app).orders._components.orders-table.columns.createdBy.name')]: row.createdBy?.name,
    //     [t('modules.(app).orders._components.orders-table.columns.createdBy.email')]:
    //       row.createdBy?.email,
    //     [t('modules.(app).orders._components.orders-table.columns.expiresAt')]: formatDate(row.expiresAt),
    //     [t('modules.(app).orders._components.orders-table.columns.expiresAtValue')]: row.expiresAt,
    //     [t('modules.(app).orders._components.orders-table.columns.createdAt')]: formatDate(row.createdAt),
    //     [t('modules.(app).orders._components.orders-table.columns.createdAtValue')]: row.createdAt
    //   }))
    // createXLSXFile(data, `Link-uri de platǎ - ${formatDate(new Date())}`)
  }

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

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='max-lg:size-9'>
                <View />
                <span className='hidden lg:block'>
                  {t('modules.(app).orders._components.orders-table.header.show.title')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {(getSession.data?.user?.role === UserRoles.ADMIN ||
                getSession.data?.user?.role === UserRoles.SUPER_ADMIN) && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t(
                        'modules.(app).orders._components.orders-table.header.show.groups.created-by.title'
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('createdBy.email')?.getFilterValue() === 'all' ||
                        !table.getColumn('createdBy.email')?.getFilterValue()
                      }
                      onCheckedChange={() => table.getColumn('createdBy.email')?.setFilterValue('all')}
                    >
                      {t(
                        'modules.(app).orders._components.orders-table.header.show.groups.created-by.values.all'
                      )}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={table.getColumn('createdBy.email')?.getFilterValue() === 'users'}
                      onCheckedChange={() => table.getColumn('createdBy.email')?.setFilterValue('users')}
                    >
                      {t(
                        'modules.(app).orders._components.orders-table.header.show.groups.created-by.values.by-me'
                      )}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t(
                    'modules.(app).orders._components.orders-table.header.show.groups.expiration-status.title'
                  )}
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'all' ||
                    !table.getColumn('expiresAt')?.getFilterValue()
                  }
                  onCheckedChange={() => table.getColumn('expiresAt')?.setFilterValue('all')}
                >
                  {t(
                    'modules.(app).orders._components.orders-table.header.show.groups.expiration-status.values.all'
                  )}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={table.getColumn('expiresAt')?.getFilterValue() === 'active'}
                  onCheckedChange={() => table.getColumn('expiresAt')?.setFilterValue('active')}
                >
                  {t(
                    'modules.(app).orders._components.orders-table.header.show.groups.expiration-status.values.active'
                  )}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={table.getColumn('expiresAt')?.getFilterValue() === 'expired'}
                  onCheckedChange={() => table.getColumn('expiresAt')?.setFilterValue('expired')}
                >
                  {t(
                    'modules.(app).orders._components.orders-table.header.show.groups.expiration-status.values.expired'
                  )}
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}
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
                    'modules.(app).orders._components.orders-table.header.columns.title'
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
                        {/* {t(
                          `modules.(app).orders._components.orders-table.columns.${column.id}`
                        )} */}
                        {column.id}
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
                    'modules.(app).orders._components.orders-table.header.actions.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              {/* <DropdownMenuItem asChild>
                <Link href='/payments/create' passHref>
                  <Plus />
                  {t('modules.(app).orders._components.orders-table.header.actions.values.create')}
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={handleOnClickDownload}>
                <Download />
                {t(
                  'modules.(app).orders._components.orders-table.header.actions.values.download'
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
                          'text-center': ['type', 'status'].includes(
                            cell.column.id
                          ),
                          'text-right': [
                            'paidAmount',
                            'paidAmountWithoutTVA',
                            'tvaAmount'
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
                    'modules.(app).orders._components.orders-table.no-results'
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
            'modules.(app).orders._components.orders-table.pagination.page-count',
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
              'modules.(app).orders._components.orders-table.pagination.rows-per-page'
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
                    'modules.(app).orders._components.orders-table.pagination.rows-per-page'
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
              'modules.(app).orders._components.orders-table.pagination.previous-page'
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
              'modules.(app).orders._components.orders-table.pagination.next-page'
            )}
          </span>
          <ChevronRight />
        </Button>
      </div>
    </FieldGroup>
  )
}

export function OrdersTableHeader({ column }: HeaderContext<Order, unknown>) {
  const t = useTranslations()

  const handleOnClickColumn = (column: Column<Order>) => {
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
      {t(`modules.(app).orders._components.orders-table.columns.${column.id}`)}
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
