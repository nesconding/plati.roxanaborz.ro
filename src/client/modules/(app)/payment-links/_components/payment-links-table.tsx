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
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState
} from '@tanstack/react-table'
import { type DateArg, format, isAfter } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  CopyCheck,
  Download,
  Plus,
  Search,
  View,
  Zap
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Badge } from '~/client/components/ui/badge'
import { Button } from '~/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '~/client/components/ui/tooltip'
import { useIsMobile } from '~/client/hooks/use-mobile'
import { cn } from '~/client/lib/utils'
import { createXLSXFile } from '~/client/lib/xlsx'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { UserRoles } from '~/shared/enums/user-roles'

type Payment =
  TRPCRouterOutput['protected']['productPaymentLinks']['findAll'][number]

const expirationStatusFilter = (
  row: Row<Payment>,
  columnId: string,
  filterValue: 'expired' | 'active' | 'all'
) => {
  if (filterValue === 'all') return true

  const expiresAt = row.getValue(columnId) as Date
  const isExpired = isAfter(new Date(), expiresAt)

  if (filterValue === 'expired') return isExpired
  if (filterValue === 'active') return !isExpired

  return true
}

const formatDate = (date: DateArg<Date> & {}) =>
  format(date, 'PPP - HH:mm', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

interface PaymentLinksTableProps {
  className?: string
  search?: string
}
export function PaymentLinksTable({
  className,
  search
}: PaymentLinksTableProps) {
  const t = useTranslations()

  const isMobile = useIsMobile()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [globalFilter, setGlobalFilter] = useState(search ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [copiedRowId, setCopiedRowId] = useState<string>()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // createdAt: false,
    // depositAmountInRON: false,
    // firstPaymentDateAfterDeposit: false,
    // id: false,
    // 'installments.installments': false,
    // 'product.name': false
  })
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})

  const trpc = useTRPC()
  const findAllPaymentLinks = useQuery(
    trpc.protected.productPaymentLinks.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )

  const data = useMemo(
    () =>
      findAllPaymentLinks.data.map((payment) => ({
        ...payment,
        searchCreatedAt: formatDate(payment.createdAt),
        searchExpiresAt: formatDate(payment.expiresAt)
      })),
    [findAllPaymentLinks.data]
  )

  const userEmailFilter = (
    row: Row<Payment>,
    columnId: string,
    filterValue: 'all' | 'users'
  ) => {
    if (filterValue !== 'users') return true

    const createdByEmail = row.getValue(columnId) as string
    const isUser = createdByEmail === getSession.data?.user?.email
    return isUser
  }

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<Payment>[] = [
    { accessorKey: 'id', header: PaymentLinksTableHeader, id: 'id' },
    {
      accessorKey: 'callerName',
      header: PaymentLinksTableHeader,
      id: 'callerName'
    },
    {
      accessorKey: 'contractId',
      header: PaymentLinksTableHeader,
      id: 'contractId'
    },
    {
      accessorKey: 'createdById',
      header: PaymentLinksTableHeader,
      id: 'createdById'
    },
    {
      accessorKey: 'currency',
      header: PaymentLinksTableHeader,
      id: 'currency'
    },
    {
      accessorKey: 'customerEmail',
      header: PaymentLinksTableHeader,
      id: 'customerEmail'
    },
    {
      accessorKey: 'customerName',
      header: PaymentLinksTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'depositAmount',
      header: PaymentLinksTableHeader,
      id: 'depositAmount'
    },
    {
      accessorKey: 'depositAmountInCents',
      header: PaymentLinksTableHeader,
      id: 'depositAmountInCents'
    },
    {
      accessorKey: 'eurToRonRate',
      header: PaymentLinksTableHeader,
      id: 'eurToRonRate'
    },
    {
      accessorKey: 'expiresAt',
      header: PaymentLinksTableHeader,
      id: 'expiresAt'
    },
    {
      accessorKey: 'extraTaxRate',
      header: PaymentLinksTableHeader,
      id: 'extraTaxRate'
    },
    {
      accessorKey: 'firstPaymentDateAfterDeposit',
      header: PaymentLinksTableHeader,
      id: 'firstPaymentDateAfterDeposit'
    },
    {
      accessorKey: 'paymentMethodType',
      header: PaymentLinksTableHeader,
      id: 'paymentMethodType'
    },
    {
      accessorKey: 'paymentProductType',
      header: PaymentLinksTableHeader,
      id: 'paymentProductType'
    },
    {
      accessorKey: 'productId',
      header: PaymentLinksTableHeader,
      id: 'productId'
    },
    {
      accessorKey: 'productInstallmentAmountToPay',
      header: PaymentLinksTableHeader,
      id: 'productInstallmentAmountToPay'
    },
    {
      accessorKey: 'productInstallmentAmountToPayInCents',
      header: PaymentLinksTableHeader,
      id: 'productInstallmentAmountToPayInCents'
    },
    {
      accessorKey: 'productInstallmentId',
      header: PaymentLinksTableHeader,
      id: 'productInstallmentId'
    },
    {
      accessorKey: 'productInstallmentsCount',
      header: PaymentLinksTableHeader,
      id: 'productInstallmentsCount'
    },
    {
      accessorKey: 'productName',
      header: PaymentLinksTableHeader,
      id: 'productName'
    },
    {
      accessorKey: 'remainingAmountToPay',
      header: PaymentLinksTableHeader,
      id: 'remainingAmountToPay'
    },
    {
      accessorKey: 'remainingAmountToPayInCents',
      header: PaymentLinksTableHeader,
      id: 'remainingAmountToPayInCents'
    },
    {
      accessorKey: 'remainingInstallmentAmountToPay',
      header: PaymentLinksTableHeader,
      id: 'remainingInstallmentAmountToPay'
    },
    {
      accessorKey: 'remainingInstallmentAmountToPayInCents',
      header: PaymentLinksTableHeader,
      id: 'remainingInstallmentAmountToPayInCents'
    },
    {
      accessorKey: 'setterName',
      header: PaymentLinksTableHeader,
      id: 'setterName'
    },
    { accessorKey: 'status', header: PaymentLinksTableHeader, id: 'status' },
    {
      accessorKey: 'stripeClientSecret',
      header: PaymentLinksTableHeader,
      id: 'stripeClientSecret'
    },
    {
      accessorKey: 'stripePaymentIntentId',
      header: PaymentLinksTableHeader,
      id: 'stripePaymentIntentId'
    },
    {
      accessorKey: 'totalAmountToPay',
      header: PaymentLinksTableHeader,
      id: 'totalAmountToPay'
    },
    {
      accessorKey: 'totalAmountToPayInCents',
      header: PaymentLinksTableHeader,
      id: 'totalAmountToPayInCents'
    },
    { accessorKey: 'tvaRate', header: PaymentLinksTableHeader, id: 'tvaRate' },
    { accessorKey: 'type', header: PaymentLinksTableHeader, id: 'type' },
    {
      accessorKey: 'createdAt',
      header: PaymentLinksTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'updatedAt',
      header: PaymentLinksTableHeader,
      id: 'updatedAt'
    },

    // {
    //   accessorKey: 'id',
    //   enableSorting: false,
    //   header: t(
    //     'modules.(app).payment-links._components.payment-links-table.columns.id'
    //   ),
    //   id: 'id'
    // },
    // {
    //   accessorKey: 'customerName',
    //   header: PaymentLinksTableHeader,
    //   id: 'customerName'
    // },
    // {
    //   accessorKey: 'customerEmail',
    //   header: PaymentLinksTableHeader,
    //   id: 'customerEmail'
    // },
    // {
    //   accessorKey: 'status',
    //   cell: ({ row }) => (
    //     <Badge
    //       className={cn('capitalize', {
    //         'bg-green-700 dark:bg-green-500':
    //           row.original.status === PaymentStatusType.Succeeded
    //       })}
    //       variant={
    //         row.original.status === PaymentStatusType.Succeeded
    //           ? 'default'
    //           : row.original.status === PaymentStatusType.Expired ||
    //               row.original.status === PaymentStatusType.PaymentFailed
    //             ? 'destructive'
    //             : 'outline'
    //       }
    //     >
    //       {t(
    //         `modules.(app).payment-links._components.payment-links-table.row.status.${row.original.status}`
    //       )}
    //     </Badge>
    //   ),
    //   header: PaymentLinksTableHeader,
    //   id: 'status'
    // },
    // {
    //   accessorKey: 'productName',
    //   header: PaymentLinksTableHeader,
    //   id: 'productName'
    // },
    // {
    //   accessorKey: 'installments',
    //   header: PaymentLinksTableHeader,
    //   id: 'installments'
    // },
    // {
    //   accessorKey: 'depositAmount',
    //   cell: ({ row }) =>
    //     row.original.depositAmount
    //       ? PricingService.formatPrice(row.original.depositAmount, 'EUR')
    //       : undefined,
    //   header: PaymentLinksTableHeader,
    //   id: 'depositAmount'
    // },
    // {
    //   accessorKey: 'firstPaymentDateAfterDeposit',
    //   cell: ({ row }) =>
    //     row.original.firstPaymentDateAfterDeposit ? (
    //       <span className='capitalize'>
    //         {formatDate(row.original.firstPaymentDateAfterDeposit)}
    //       </span>
    //     ) : null,
    //   header: PaymentLinksTableHeader,
    //   id: 'firstPaymentDateAfterDeposit'
    // },
    // {
    //   accessorKey: 'amountToPay',
    //   cell: ({ row }) =>
    //     PricingService.formatPrice(row.original.totalAmountToPay, 'EUR'),
    //   header: PaymentLinksTableHeader,
    //   id: 'amountToPay'
    // },
    // {
    //   accessorKey: 'createdBy.name',
    //   header: PaymentLinksTableHeader,
    //   id: 'createdBy.name'
    // },
    // {
    //   accessorKey: 'createdBy.email',
    //   filterFn: userEmailFilter,
    //   header: PaymentLinksTableHeader,
    //   id: 'createdBy.email'
    // },
    // {
    //   accessorKey: 'expiresAt',
    //   cell: ({ row }) => (
    //     <span
    //       className={cn('capitalize', {
    //         'text-destructive line-through':
    //           isAfter(new Date(), row.original.expiresAt) &&
    //           (row.original.status === PaymentStatusType.Canceled ||
    //             row.original.status === PaymentStatusType.Expired),
    //         'text-green-700 line-through dark:text-green-500':
    //           row.original.status === PaymentStatusType.Succeeded
    //       })}
    //     >
    //       {formatDate(row.original.expiresAt)}
    //     </span>
    //   ),
    //   filterFn: expirationStatusFilter,
    //   header: PaymentLinksTableHeader,
    //   id: 'expiresAt'
    // },
    // {
    //   accessorKey: 'searchExpiresAt',
    //   cell: () => null,
    //   enableColumnFilter: false,
    //   enableHiding: false,
    //   enableSorting: false,
    //   header: () => null,
    //   id: 'searchExpiresAt'
    // },
    // {
    //   accessorKey: 'createdAt',
    //   cell: ({ row }) => (
    //     <span className='capitalize'>{formatDate(row.original.createdAt)}</span>
    //   ),
    //   header: PaymentLinksTableHeader,
    //   id: 'createdAt'
    // },
    // {
    //   accessorKey: 'searchCreatedAt',
    //   cell: () => null,
    //   enableColumnFilter: false,
    //   enableHiding: false,
    //   enableSorting: false,
    //   header: () => null,
    //   id: 'searchCreatedAt'
    // },
    {
      accessorKey: 'copy-link',
      cell: ({ row }) => {
        const isCopied = copiedRowId === row.original.id

        function handleOnClickCopy() {
          const url = window.location.origin + `/checkout/${row.original.id}`
          navigator.clipboard.writeText(url)
          setCopiedRowId(row.original.id)
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className='relative'
                onClick={handleOnClickCopy}
                size='icon-sm'
                variant='outline'
              >
                <Copy
                  className={cn(
                    'absolute flex rotate-0 items-center gap-1 transition-all',
                    {
                      'scale-0 -rotate-90': isCopied,
                      'scale-100': !isCopied
                    }
                  )}
                />

                <CopyCheck
                  className={cn(
                    'absolute flex rotate-0 items-center gap-1 transition-all',
                    {
                      'scale-0 rotate-90': !isCopied,
                      'scale-100': isCopied
                    }
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCopied
                ? t(
                    'modules.(app).payment-links._components.payment-links-table.row.actions.values.copied'
                  )
                : t(
                    'modules.(app).payment-links._components.payment-links-table.row.actions.values.copy'
                  )}
            </TooltipContent>
          </Tooltip>
        )
      },
      enableColumnFilter: false,
      enableGlobalFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'copy-link'
    }
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
    const data = table
      .getRowModel()
      .rows.map((row) => row.original)
      .map((row) => ({
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.id'
        )]: row.id,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.customerName'
        )]: row.customerName,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.customerEmail'
        )]: row.customerEmail,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.productName'
        )]: row.productName,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.installments'
        )]: row.productInstallmentsCount,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.depositAmount'
        )]: row.depositAmount,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.firstPaymentDateAfterDeposit'
        )]: row.firstPaymentDateAfterDeposit
          ? formatDate(row.firstPaymentDateAfterDeposit)
          : undefined,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.firstPaymentDateValue'
        )]: row.firstPaymentDateAfterDeposit,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.amountToPay'
        )]: row.totalAmountToPay,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.createdBy.name'
        )]: row.createdBy?.name,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.createdBy.email'
        )]: row.createdBy?.email,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.expiresAt'
        )]: formatDate(row.expiresAt),
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.expiresAtValue'
        )]: row.expiresAt,
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.createdAt'
        )]: formatDate(row.createdAt),
        [t(
          'modules.(app).payment-links._components.payment-links-table.columns.createdAtValue'
        )]: row.createdAt
      }))
    createXLSXFile(data, `Link-uri de platǎ - ${formatDate(new Date())}`)
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
              placeholder={t(
                'modules.(app).payment-links._components.payment-links-table.header.input.placeholder'
              )}
              value={searchInput}
            />
          </InputGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='max-lg:size-9' variant='outline'>
                <View />
                <span className='hidden lg:block'>
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.show.title'
                  )}
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
                        'modules.(app).payment-links._components.payment-links-table.header.show.groups.created-by.title'
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      // checked={
                      //   table.getColumn('createdBy.email')?.getFilterValue() ===
                      //     'all' ||
                      //   !table.getColumn('createdBy.email')?.getFilterValue()
                      // }
                      onCheckedChange={() =>
                        table
                          .getColumn('createdBy.email')
                          ?.setFilterValue('all')
                      }
                    >
                      {t(
                        'modules.(app).payment-links._components.payment-links-table.header.show.groups.created-by.values.all'
                      )}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      // checked={
                      //   table.getColumn('createdBy.email')?.getFilterValue() ===
                      //   'users'
                      // }
                      onCheckedChange={() =>
                        table
                          .getColumn('createdBy.email')
                          ?.setFilterValue('users')
                      }
                    >
                      {t(
                        'modules.(app).payment-links._components.payment-links-table.header.show.groups.created-by.values.by-me'
                      )}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.show.groups.expiration-status.title'
                  )}
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'all' ||
                    !table.getColumn('expiresAt')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('expiresAt')?.setFilterValue('all')
                  }
                >
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.show.groups.expiration-status.values.all'
                  )}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'active'
                  }
                  onCheckedChange={() =>
                    table.getColumn('expiresAt')?.setFilterValue('active')
                  }
                >
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.show.groups.expiration-status.values.active'
                  )}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'expired'
                  }
                  onCheckedChange={() =>
                    table.getColumn('expiresAt')?.setFilterValue('expired')
                  }
                >
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.show.groups.expiration-status.values.expired'
                  )}
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    'modules.(app).payment-links._components.payment-links-table.header.columns.title'
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
                          `modules.(app).payment-links._components.payment-links-table.columns.${column.id}`
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
                    'modules.(app).payment-links._components.payment-links-table.header.actions.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link href='/payment-links/create' passHref>
                  <Plus />
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.header.actions.values.create'
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOnClickDownload}>
                <Download />
                {t(
                  'modules.(app).payment-links._components.payment-links-table.header.actions.values.download'
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
                    className='h-14'
                    data-state={row.getIsSelected() && 'selected'}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={cn('text-center', {
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
                  className='h-[calc(--spacing(14)*10)] text-center'
                  colSpan={columns.length}
                >
                  {t(
                    'modules.(app).payment-links._components.payment-links-table.no-results'
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
            'modules.(app).payment-links._components.payment-links-table.pagination.page-count',
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
              'modules.(app).payment-links._components.payment-links-table.pagination.rows-per-page'
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
                    'modules.(app).payment-links._components.payment-links-table.pagination.rows-per-page'
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
              'modules.(app).payment-links._components.payment-links-table.pagination.previous-page'
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
              'modules.(app).payment-links._components.payment-links-table.pagination.next-page'
            )}
          </span>
          <ChevronRight />
        </Button>
      </div>
    </FieldGroup>
  )
}

export function PaymentLinksTableHeader({
  column
}: HeaderContext<Payment, unknown>) {
  const t = useTranslations()

  const handleOnClickColumn = (column: Column<Payment>) => {
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
      {/* {t(
        `modules.(app).payment-links._components.payment-links-table.columns.${column.id}`
      )} */}
      {column.id}
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
