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
import { DatesService } from '~/server/services/dates'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { UserRoles } from '~/shared/enums/user-roles'

type ProductPaymentLink =
  TRPCRouterOutput['protected']['productPaymentLinks']['findAll'][number]

type ExtensionPaymentLink =
  TRPCRouterOutput['protected']['extensionPaymentLinks']['findAll'][number]

type PaymentLink = ProductPaymentLink | ExtensionPaymentLink

function isProductPaymentLink(
  paymentLink: PaymentLink
): paymentLink is ProductPaymentLink {
  return paymentLink.paymentProductType === PaymentProductType.Product
}

function isExtensionPaymentLink(
  paymentLink: PaymentLink
): paymentLink is ExtensionPaymentLink {
  return paymentLink.paymentProductType === PaymentProductType.Extension
}

const expirationStatusFilter = (
  row: Row<ProductPaymentLink | ExtensionPaymentLink>,
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

const statusFilter = (
  row: Row<ProductPaymentLink | ExtensionPaymentLink>,
  columnId: string,
  filterValue: PaymentStatusType | 'all'
) => {
  if (filterValue === 'all') return true
  const status = row.getValue(columnId) as PaymentStatusType
  return status === filterValue
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
  const t = useTranslations(
    'modules.(app).payment-links._components.payment-links-table'
  )

  const isMobile = useIsMobile()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [globalFilter, setGlobalFilter] = useState(search ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [copiedRowId, setCopiedRowId] = useState<string>()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})

  const trpc = useTRPC()
  const findAllProductsPaymentLinks = useQuery(
    trpc.protected.productPaymentLinks.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const findAllExtensionPaymentLinks = useQuery(
    trpc.protected.extensionPaymentLinks.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )

  const data = useMemo(
    () =>
      [
        ...findAllProductsPaymentLinks.data,
        ...findAllExtensionPaymentLinks.data
      ].map((payment) => ({
        ...payment,
        searchCreatedAt: formatDate(payment.createdAt),
        searchExpiresAt: formatDate(payment.expiresAt)
      })),
    [findAllProductsPaymentLinks.data, findAllExtensionPaymentLinks.data]
  )

  const userEmailFilter = (
    row: Row<ProductPaymentLink | ExtensionPaymentLink>,
    columnId: string,
    filterValue: 'all' | 'users'
  ) => {
    if (filterValue !== 'users') return true

    const createdByEmail = row.getValue(columnId) as string
    const isUser = createdByEmail === getSession.data?.user?.email
    return isUser
  }

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<ProductPaymentLink | ExtensionPaymentLink>[] = [
    {
      accessorKey: 'copy-link',
      cell: ({ row }) => {
        const isCopied = copiedRowId === row.original.id

        function handleOnClickCopy() {
          const url = `${window.location.origin}/checkout/${row.original.id}`
          navigator.clipboard.writeText(url)
          setCopiedRowId(row.original.id)
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className='relative'
                disabled={
                  row.original.status === PaymentStatusType.Expired ||
                  row.original.status === PaymentStatusType.Succeeded ||
                  DatesService.isAfter(new Date(), row.original.expiresAt)
                }
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
                ? t('row.actions.values.copied')
                : t('row.actions.values.copy')}
            </TooltipContent>
          </Tooltip>
        )
      },
      enableColumnFilter: false,
      enableGlobalFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: t('columns.copy-link'),
      id: 'copy-link'
    },
    { accessorKey: 'id', header: PaymentLinksTableHeader, id: 'id' },
    {
      accessorKey: 'callerName',
      header: PaymentLinksTableHeader,
      id: 'callerName'
    },
    {
      accessorKey: 'contract.name',
      cell: ({ row }) =>
        isProductPaymentLink(row.original) ? row.original.contract.name : null,
      header: PaymentLinksTableHeader,
      id: 'contract.name'
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
      cell: ({ row }) =>
        row.original.depositAmount
          ? PricingService.formatPrice(
              row.original.depositAmount,
              row.original.currency
            )
          : null,
      header: PaymentLinksTableHeader,
      id: 'depositAmount'
    },
    {
      accessorKey: 'eurToRonRate',
      header: PaymentLinksTableHeader,
      id: 'eurToRonRate'
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
      accessorKey: 'productInstallmentAmountToPay',
      cell: ({ row }) =>
        'productInstallmentAmountToPay' in row.original &&
        row.original.productInstallmentAmountToPay
          ? PricingService.formatPrice(
              row.original.productInstallmentAmountToPay,
              row.original.currency
            )
          : null,
      header: PaymentLinksTableHeader,
      id: 'productInstallmentAmountToPay'
    },
    {
      accessorKey: 'extensionInstallmentAmountToPay',
      cell: ({ row }) =>
        'extensionInstallmentAmountToPay' in row.original &&
        row.original.extensionInstallmentAmountToPay
          ? PricingService.formatPrice(
              row.original.extensionInstallmentAmountToPay,
              row.original.currency
            )
          : null,
      header: PaymentLinksTableHeader,
      id: 'extensionInstallmentAmountToPay'
    },
    {
      accessorKey: 'productInstallmentsCount',
      cell: ({ row }) =>
        isProductPaymentLink(row.original)
          ? row.original.productInstallmentsCount
          : null,
      header: PaymentLinksTableHeader,
      id: 'productInstallmentsCount'
    },
    {
      accessorKey: 'extensionInstallmentsCount',
      cell: ({ row }) =>
        isExtensionPaymentLink(row.original)
          ? row.original.extensionInstallmentsCount
          : null,
      header: PaymentLinksTableHeader,
      id: 'extensionInstallmentsCount'
    },
    {
      accessorKey: 'productName',
      header: PaymentLinksTableHeader,
      id: 'productName'
    },
    {
      accessorKey: 'remainingAmountToPay',
      cell: ({ row }) =>
        row.original.remainingAmountToPay
          ? PricingService.formatPrice(
              row.original.remainingAmountToPay,
              row.original.currency
            )
          : null,
      header: PaymentLinksTableHeader,
      id: 'remainingAmountToPay'
    },
    {
      accessorKey: 'remainingInstallmentAmountToPay',
      cell: ({ row }) =>
        row.original.remainingInstallmentAmountToPay
          ? PricingService.formatPrice(
              row.original.remainingInstallmentAmountToPay,
              row.original.currency
            )
          : null,
      header: PaymentLinksTableHeader,
      id: 'remainingInstallmentAmountToPay'
    },
    {
      accessorKey: 'setterEmail',
      header: PaymentLinksTableHeader,
      id: 'setterEmail'
    },
    {
      accessorKey: 'setterName',
      header: PaymentLinksTableHeader,
      id: 'setterName'
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          className={cn('capitalize', {
            'bg-green-700 dark:bg-green-500':
              row.original.status === PaymentStatusType.Succeeded
          })}
          variant={
            row.original.status === PaymentStatusType.Succeeded
              ? 'default'
              : row.original.status === PaymentStatusType.Expired ||
                  row.original.status === PaymentStatusType.PaymentFailed
                ? 'destructive'
                : 'outline'
          }
        >
          {t(`row.status.${row.original.status}`)}
        </Badge>
      ),
      filterFn: statusFilter,
      header: PaymentLinksTableHeader,
      id: 'status'
    },
    {
      accessorKey: 'membershipId',
      header: PaymentLinksTableHeader,
      id: 'membershipId'
    },
    {
      accessorKey: 'totalAmountToPay',
      cell: ({ row }) =>
        PricingService.formatPrice(
          row.original.totalAmountToPay,
          row.original.currency
        ),
      header: PaymentLinksTableHeader,
      id: 'totalAmountToPay'
    },
    {
      accessorKey: 'totalAmountToPayInCents',
      header: PaymentLinksTableHeader,
      id: 'totalAmountToPayInCents'
    },
    { accessorKey: 'tvaRate', header: PaymentLinksTableHeader, id: 'tvaRate' },
    {
      accessorKey: 'type',
      cell: ({ row }) => t(`columns.typeValues.${row.original.type}`),
      header: PaymentLinksTableHeader,
      id: 'type'
    },
    {
      accessorKey: 'createdBy.name',
      header: PaymentLinksTableHeader,
      id: 'createdBy.name'
    },
    {
      accessorKey: 'createdBy.email',
      filterFn: userEmailFilter,
      header: PaymentLinksTableHeader,
      id: 'createdBy.email'
    },
    {
      accessorKey: 'expiresAt',
      cell: ({ row }) => (
        <span
          className={cn('capitalize', {
            'text-destructive line-through':
              isAfter(new Date(), row.original.expiresAt) &&
              (row.original.status === PaymentStatusType.Canceled ||
                row.original.status === PaymentStatusType.Expired),
            'text-green-700 line-through dark:text-green-500':
              row.original.status === PaymentStatusType.Succeeded
          })}
        >
          {formatDate(row.original.expiresAt)}
        </span>
      ),
      filterFn: expirationStatusFilter,
      header: PaymentLinksTableHeader,
      id: 'expiresAt'
    },
    {
      accessorKey: 'searchExpiresAt',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchExpiresAt'
    },
    {
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className='capitalize'>{formatDate(row.original.createdAt)}</span>
      ),
      header: PaymentLinksTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'searchCreatedAt',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchCreatedAt'
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
        [t('columns.callerName')]: row.callerName ?? '',
        [t('columns.contract.name')]: isProductPaymentLink(row)
          ? row.contract.name
          : undefined,
        [t('columns.contractId')]: isProductPaymentLink(row)
          ? row.contractId
          : undefined,
        [t('columns.createdAt')]: DatesService.formatDate(row.createdAt),
        [t('columns.createdBy.email')]: row.createdBy.email ?? '',
        [t('columns.createdBy.name')]: row.createdBy.name ?? '',
        [t('columns.createdById')]: row.createdById,
        [t('columns.currency')]: row.currency,
        [t('columns.customerEmail')]: row.customerEmail,
        [t('columns.customerName')]: row.customerName ?? '',
        [t('columns.deletedAt')]: row.deletedAt ?? '',
        [t('columns.depositAmount')]: row.depositAmount ?? '',
        [t('columns.depositAmountInCents')]: row.depositAmountInCents ?? '',
        [t('columns.eurToRonRate')]: row.eurToRonRate ?? '',
        [t('columns.expiresAt')]: DatesService.formatDate(row.expiresAt),
        [t('columns.extraTaxRate')]: row.extraTaxRate,
        [t('columns.firstPaymentDateAfterDeposit')]:
          row.firstPaymentDateAfterDeposit
            ? DatesService.formatDate(row.firstPaymentDateAfterDeposit)
            : '',
        [t('columns.id')]: row.id,
        [t('columns.paymentMethodType')]: t(
          `columns.paymentMethodTypeValues.${row.paymentMethodType}`
        ),
        [t('columns.paymentProductType')]: t(
          `columns.paymentProductTypeValues.${row.paymentProductType}`
        ),
        [t('columns.productId')]: isProductPaymentLink(row)
          ? row.productId
          : undefined,
        [t('columns.productInstallmentAmountToPay')]: isProductPaymentLink(row)
          ? (row.productInstallmentAmountToPay ?? '')
          : undefined,
        [t('columns.productInstallmentAmountToPayInCents')]:
          isProductPaymentLink(row)
            ? (row.productInstallmentAmountToPayInCents ?? '')
            : undefined,
        [t('columns.productInstallmentId')]: isProductPaymentLink(row)
          ? (row.productInstallmentId ?? '')
          : undefined,
        [t('columns.productInstallmentsCount')]: isProductPaymentLink(row)
          ? (row.productInstallmentsCount ?? '')
          : undefined,
        [t('columns.productName')]: isProductPaymentLink(row)
          ? row.productName
          : undefined,
        [t('columns.extensionId')]: isExtensionPaymentLink(row)
          ? row.extensionId
          : undefined,
        [t('columns.extensionInstallmentAmountToPay')]: isExtensionPaymentLink(
          row
        )
          ? (row.extensionInstallmentAmountToPay ?? '')
          : undefined,
        [t('columns.extensionInstallmentAmountToPayInCents')]:
          isExtensionPaymentLink(row)
            ? (row.extensionInstallmentAmountToPayInCents ?? '')
            : undefined,
        [t('columns.extensionInstallmentId')]: isExtensionPaymentLink(row)
          ? (row.extensionInstallmentId ?? '')
          : undefined,
        [t('columns.extensionInstallmentsCount')]: isExtensionPaymentLink(row)
          ? (row.extensionInstallmentsCount ?? '')
          : undefined,
        [t('columns.membershipId')]: isExtensionPaymentLink(row)
          ? row.membershipId
          : undefined,
        [t('columns.remainingAmountToPay')]: row.remainingAmountToPay ?? '',
        [t('columns.remainingAmountToPayInCents')]:
          row.remainingAmountToPayInCents ?? '',
        [t('columns.remainingInstallmentAmountToPay')]:
          row.remainingInstallmentAmountToPay ?? '',
        [t('columns.remainingInstallmentAmountToPayInCents')]:
          row.remainingInstallmentAmountToPayInCents ?? '',
        [t('columns.searchCreatedAt')]: DatesService.formatDate(row.createdAt),
        [t('columns.searchExpiresAt')]: DatesService.formatDate(row.expiresAt),
        [t('columns.setterName')]: row.setterName ?? '',
        [t('columns.status')]: row.status,
        [t('columns.stripeClientSecret')]: row.stripeClientSecret,
        [t('columns.stripePaymentIntentId')]: row.stripePaymentIntentId,
        [t('columns.totalAmountToPay')]: row.totalAmountToPay,
        [t('columns.totalAmountToPayInCents')]: row.totalAmountToPayInCents,
        [t('columns.tvaRate')]: row.tvaRate,
        [t('columns.type')]: t(`columns.typeValues.${row.type}`),
        [t('columns.updatedAt')]: DatesService.formatDate(row.updatedAt)
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
              placeholder={t('header.input.placeholder')}
              value={searchInput}
            />
          </InputGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='max-lg:size-9' variant='outline'>
                <View />
                <span className='hidden lg:block'>
                  {t('header.show.title')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {(getSession.data?.user?.role === UserRoles.ADMIN ||
                getSession.data?.user?.role === UserRoles.SUPER_ADMIN) && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t('header.show.groups.created-by.title')}
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('createdBy.email')?.getFilterValue() ===
                          'all' ||
                        !table.getColumn('createdBy.email')?.getFilterValue()
                      }
                      onCheckedChange={() =>
                        table
                          .getColumn('createdBy.email')
                          ?.setFilterValue('all')
                      }
                    >
                      {t('header.show.groups.created-by.values.all')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('createdBy.email')?.getFilterValue() ===
                        'users'
                      }
                      onCheckedChange={() =>
                        table
                          .getColumn('createdBy.email')
                          ?.setFilterValue('users')
                      }
                    >
                      {t('header.show.groups.created-by.values.by-me')}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('header.show.groups.status.title')}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('status')?.getFilterValue() === 'all' ||
                    !table.getColumn('status')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('status')?.setFilterValue('all')
                  }
                >
                  {t('header.show.groups.status.values.all')}
                </DropdownMenuCheckboxItem>

                {Object.values(PaymentStatusType)
                  .map((status) => ({
                    label: t(`header.show.groups.status.values.${status}`),
                    status
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ status, label }) => (
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('status')?.getFilterValue() === status
                      }
                      key={status}
                      onCheckedChange={() =>
                        table.getColumn('status')?.setFilterValue(status)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('header.show.groups.expiration-status.title')}
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
                  {t('header.show.groups.expiration-status.values.all')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'active'
                  }
                  onCheckedChange={() =>
                    table.getColumn('expiresAt')?.setFilterValue('active')
                  }
                >
                  {t('header.show.groups.expiration-status.values.active')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('expiresAt')?.getFilterValue() === 'expired'
                  }
                  onCheckedChange={() =>
                    table.getColumn('expiresAt')?.setFilterValue('expired')
                  }
                >
                  {t('header.show.groups.expiration-status.values.expired')}
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
                  {t('header.columns.title')}
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
                        {t(`columns.${column.id}`)}
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
                  {t('header.actions.title')}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link href='/payment-links/create' passHref>
                  <Plus />
                  {t('header.actions.values.create')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOnClickDownload}>
                <Download />
                {t('header.actions.values.download')}
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
                          'text-left': ['copy-link'].includes(cell.column.id),
                          'text-right': [
                            'totalAmountToPay',
                            'depositAmount',
                            'productInstallmentAmountToPay',
                            'remainingAmountToPay',
                            'remainingInstallmentAmountToPay'
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
                  {t('no-results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Field>

      <div className='flex h-fit items-center justify-end gap-1.5 lg:gap-3'>
        <div className='mr-auto text-xs font-medium sm:text-sm'>
          {t('pagination.page-count', {
            page: table.getState().pagination.pageIndex + 1,
            pageCount: table.getPageCount()
          })}
        </div>

        <div className='flex items-center gap-1.5'>
          <Label
            className='text-sm font-medium max-sm:hidden'
            htmlFor='rows-per-page'
          >
            {t('pagination.rows-per-page')}
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
                  {t('pagination.rows-per-page')}
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
            {t('pagination.previous-page')}
          </span>
        </Button>

        <Button
          className='select-none max-lg:size-8'
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size='sm'
          variant='outline'
        >
          <span className='hidden lg:block'>{t('pagination.next-page')}</span>
          <ChevronRight />
        </Button>
      </div>
    </FieldGroup>
  )
}

export function PaymentLinksTableHeader({
  column
}: HeaderContext<PaymentLink, unknown>) {
  const t = useTranslations(
    'modules.(app).payment-links._components.payment-links-table'
  )

  const handleOnClickColumn = (column: Column<PaymentLink>) => {
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
      {t(`columns.${column.id}`)}
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
