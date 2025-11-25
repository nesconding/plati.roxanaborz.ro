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
import { type DateArg, format } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  AlertCircle,
  Ban,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  EllipsisVertical,
  Pause,
  Search,
  TriangleAlert,
  View,
  X,
  Zap
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  InputGroupButton,
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
import { DatesService } from '~/server/services/dates'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { UserRoles } from '~/shared/enums/user-roles'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'
import { ReschedulePaymentDialog } from './reschedule-payment-dialog'
import { SetOnHoldDialog } from './set-on-hold-dialog'

type ExtensionSubscription =
  TRPCRouterOutput['protected']['extensionsSubscriptions']['findAll'][number]

type ProductSubscription =
  TRPCRouterOutput['protected']['productSubscriptions']['findAll'][number]

type Subscription = ExtensionSubscription | ProductSubscription

function isProductSubscription(
  subscription: Subscription
): subscription is ProductSubscription {
  return subscription.productPaymentType === PaymentProductType.Product
}

const statusFilter = (
  row: Row<Subscription>,
  columnId: string,
  filterValue: SubscriptionStatusType | 'all'
) => {
  if (filterValue === 'all') return true
  const status = row.getValue(columnId) as SubscriptionStatusType
  return status === filterValue
}

const paymentMethodFilter = (
  row: Row<Subscription>,
  columnId: string,
  filterValue: PaymentMethodType | 'all'
) => {
  if (filterValue === 'all') return true
  const paymentMethod = row.getValue(columnId) as PaymentMethodType
  return paymentMethod === filterValue
}

const productPaymentTypeFilter = (
  row: Row<Subscription>,
  columnId: string,
  filterValue: PaymentProductType | 'all'
) => {
  if (filterValue === 'all') return true
  const productType = row.getValue(columnId) as PaymentProductType
  return productType === filterValue
}

const formatDate = (
  date: DateArg<Date> & {},
  { withTime = false }: { withTime?: boolean } = {}
) => format(date, withTime ? 'PPP - HH:mm' : 'PPP', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

interface SubscriptionsTableProps {
  className?: string
  search?: string
}
export function SubscriptionsTable({
  className,
  search
}: SubscriptionsTableProps) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.subscriptions-table'
  )

  const isMobile = useIsMobile()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [globalFilter, setGlobalFilter] = useState(search ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})
  const router = useRouter()
  // Dialog states
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [setOnHoldDialogOpen, setSetOnHoldDialogOpen] = useState(false)

  const trpc = useTRPC()
  const getExtensionsSubscriptions = useQuery(
    trpc.protected.extensionsSubscriptions.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const getProductSubscriptions = useQuery(
    trpc.protected.productSubscriptions.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )

  const data = useMemo(
    () =>
      [...getProductSubscriptions.data, ...getExtensionsSubscriptions.data].map(
        (subscription) => ({
          ...subscription,
          searchCreatedAt: formatDate(subscription.createdAt),
          searchNextPaymentDate: subscription.nextPaymentDate
            ? formatDate(subscription.nextPaymentDate)
            : '',
          searchStartDate: subscription.startDate
            ? formatDate(subscription.startDate)
            : ''
        })
      ),
    [getProductSubscriptions.data, getExtensionsSubscriptions.data]
  )

  const userEmailFilter = (
    row: Row<Subscription>,
    columnId: string,
    filterValue: 'all' | 'users'
  ) => {
    if (filterValue !== 'users') return true

    const customerEmail = row.getValue(columnId) as string
    const isUser = customerEmail === getSession.data?.user?.email
    return isUser
  }

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<Subscription>[] = [
    { accessorKey: 'id', header: SubscriptionsTableHeader, id: 'id' },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          className={cn('capitalize', {
            'bg-green-700 dark:bg-green-500':
              row.original.status === SubscriptionStatusType.Completed
          })}
          variant={
            row.original.status === SubscriptionStatusType.Active ||
            row.original.status === SubscriptionStatusType.Completed
              ? 'default'
              : row.original.status === SubscriptionStatusType.Cancelled
                ? 'destructive'
                : 'secondary'
          }
        >
          {t(`columns.statusValues.${row.original.status}`)}
        </Badge>
      ),
      filterFn: statusFilter,
      header: SubscriptionsTableHeader,
      id: 'status'
    },
    {
      cell: ({ row }) => {
        const hasPaymentFailures = row.original.paymentFailureCount > 0
        const hasScheduledCancellation =
          row.original.scheduledCancellationDate !== null

        if (!hasPaymentFailures && !hasScheduledCancellation) return null

        return (
          <div className='flex items-center gap-2'>
            {hasPaymentFailures && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4 text-destructive' />
                    <Badge className='text-xs' variant='destructive'>
                      {t('alerts.payment-failures.badge', {
                        count: row.original.paymentFailureCount
                      })}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-semibold'>
                    {t('alerts.payment-failures.title')}
                  </p>
                  {row.original.lastPaymentFailureReason && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      {t('alerts.payment-failures.last-reason', {
                        reason: row.original.lastPaymentFailureReason
                      })}
                    </p>
                  )}
                  {row.original.lastPaymentAttemptDate && (
                    <p className='text-xs text-muted-foreground'>
                      {t('alerts.payment-failures.last-attempt', {
                        date: formatDate(row.original.lastPaymentAttemptDate)
                      })}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            {hasScheduledCancellation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1'>
                    <TriangleAlert className='h-4 w-4 text-yellow-600 dark:text-yellow-500' />
                    <Badge className='text-xs' variant='secondary'>
                      {t('alerts.scheduled-cancellation.badge')}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-semibold'>
                    {t('alerts.scheduled-cancellation.title')}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {t('alerts.scheduled-cancellation.message', {
                      date: formatDate(row.original.scheduledCancellationDate!)
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      },
      enableHiding: false,
      enableSorting: false,
      header: () => (
        <span className='text-xs text-muted-foreground'>
          {t('alerts.title')}
        </span>
      ),
      id: 'alerts'
    },
    {
      accessorKey: 'customerName',
      header: SubscriptionsTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'customerEmail',
      filterFn: userEmailFilter,
      header: SubscriptionsTableHeader,
      id: 'customerEmail'
    },
    {
      accessorKey: 'productName',
      header: SubscriptionsTableHeader,
      id: 'productName'
    },
    {
      accessorKey: 'paymentMethod',
      cell: ({ row }) =>
        t(`columns.paymentMethodValues.${row.original.paymentMethod}`),
      filterFn: paymentMethodFilter,
      header: SubscriptionsTableHeader,
      id: 'paymentMethod'
    },
    {
      accessorKey: 'productPaymentType',
      cell: ({ row }) =>
        t(
          `columns.productPaymentTypeValues.${row.original.productPaymentType}`
        ),
      filterFn: productPaymentTypeFilter,
      header: SubscriptionsTableHeader,
      id: 'productPaymentType'
    },
    {
      accessorKey: 'nextPaymentDate',
      cell: ({ row }) =>
        row.original.nextPaymentDate ? (
          <span className='capitalize'>
            {formatDate(row.original.nextPaymentDate)}
          </span>
        ) : null,
      header: SubscriptionsTableHeader,
      id: 'nextPaymentDate'
    },
    {
      accessorKey: 'remainingPayments',
      header: SubscriptionsTableHeader,
      id: 'remainingPayments'
    },
    {
      accessorKey: 'membershipId',
      cell: ({ row }) => (
        <Button asChild className='cursor-pointer' variant='link'>
          <Link
            href={{
              pathname: '/memberships',
              query: { search: row.original.membershipId }
            }}
          >
            {row.original.membershipId}
          </Link>
        </Button>
      ),
      header: SubscriptionsTableHeader,
      id: 'membershipId'
    },
    {
      accessorKey: 'parentOrderId',
      cell: ({ row }) => (
        <Button asChild className='cursor-pointer' variant='link'>
          <Link
            href={{
              pathname: '/orders',
              query: { search: row.original.parentOrderId }
            }}
          >
            {row.original.parentOrderId}
          </Link>
        </Button>
      ),
      header: SubscriptionsTableHeader,
      id: 'parentOrderId'
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
      cell: ({ row }) =>
        row.original.startDate ? (
          <span className='capitalize'>
            {formatDate(row.original.startDate)}
          </span>
        ) : null,
      header: SubscriptionsTableHeader,
      id: 'startDate'
    },
    {
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className='capitalize'>
          {formatDate(row.original.createdAt, { withTime: true })}
        </span>
      ),
      header: SubscriptionsTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <span className='capitalize'>
          {formatDate(row.original.updatedAt, { withTime: true })}
        </span>
      ),
      header: SubscriptionsTableHeader,
      id: 'updatedAt'
    },
    {
      cell: ({ row }) => {
        const subscription = row.original
        const isActive = subscription.status === SubscriptionStatusType.Active
        const isCancelled =
          subscription.status === SubscriptionStatusType.Cancelled
        const isCompleted =
          subscription.status === SubscriptionStatusType.Completed

        const isDisabled = (isCancelled || isCompleted) && !isActive

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isDisabled}>
              <Button size='icon-sm' variant='ghost'>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t('actions.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isCancelled || isCompleted}
                  onSelect={() => {
                    setSelectedSubscription(subscription)
                    setCancelDialogOpen(true)
                  }}
                >
                  <Ban />
                  {t('actions.cancel-subscription')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!isActive}
                  onSelect={() => {
                    setSelectedSubscription(subscription)
                    setSetOnHoldDialogOpen(true)
                  }}
                >
                  <Pause />
                  {t('actions.set-on-hold')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isCancelled || isCompleted}
                  onSelect={() => {
                    setSelectedSubscription(subscription)
                    setRescheduleDialogOpen(true)
                  }}
                >
                  <CalendarClock />
                  {t('actions.reschedule-payment')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableHiding: false,
      enableSorting: false,
      header: () => <span className='sr-only'>Actions</span>,
      id: 'actions'
    },
    {
      accessorKey: 'searchCreatedAt',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchCreatedAt'
    },
    {
      accessorKey: 'searchNextPaymentDate',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchNextPaymentDate'
    },
    {
      accessorKey: 'searchStartDate',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchStartDate'
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
    const downloadData = data.map((row) => ({
      [t('columns.id')]: row.id,
      [t('columns.status')]: t(`columns.statusValues.${row.status}`),
      [t('columns.customerName')]: row.customerName ?? '',
      [t('columns.customerEmail')]: row.customerEmail,
      [t('columns.productName')]: row.productName,
      [t('columns.paymentMethod')]: t(
        `columns.paymentMethodValues.${row.paymentMethod}`
      ),
      [t('columns.productPaymentType')]: t(
        `columns.productPaymentTypeValues.${row.productPaymentType}`
      ),
      [t('columns.nextPaymentDate')]: row.nextPaymentDate
        ? DatesService.formatDate(row.nextPaymentDate)
        : '',
      [t('columns.remainingPayments')]: row.remainingPayments,
      [t('columns.membershipId')]: row.membershipId,
      [t('columns.parentOrderId')]: row.parentOrderId,
      [t('columns.productId')]: isProductSubscription(row) ? row.productId : '',
      [t('columns.extensionId')]: !isProductSubscription(row)
        ? (row as Extract<typeof row, { extensionId: string }>).extensionId
        : '',
      [t('columns.startDate')]: row.startDate
        ? DatesService.formatDate(row.startDate)
        : '',
      [t('columns.createdAt')]: DatesService.formatDate(row.createdAt),
      [t('columns.updatedAt')]: DatesService.formatDate(row.updatedAt)
    }))

    createXLSXFile(downloadData, `Abonamente - ${formatDate(new Date())}`)
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
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                className={cn({ hidden: searchInput.length === 0 })}
                onClick={() => {
                  setSearchInput('')
                  debouncedSetGlobalFilter('')
                  router.replace('/subscriptions')
                }}
                size='icon-xs'
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
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
                        table.getColumn('customerEmail')?.getFilterValue() ===
                          'all' ||
                        !table.getColumn('customerEmail')?.getFilterValue()
                      }
                      onCheckedChange={() =>
                        table.getColumn('customerEmail')?.setFilterValue('all')
                      }
                    >
                      {t('header.show.groups.created-by.values.all')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('customerEmail')?.getFilterValue() ===
                        'users'
                      }
                      onCheckedChange={() =>
                        table
                          .getColumn('customerEmail')
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

                {Object.values(SubscriptionStatusType)
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
                  {t('header.show.groups.payment-method.title')}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('paymentMethod')?.getFilterValue() ===
                      'all' ||
                    !table.getColumn('paymentMethod')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('paymentMethod')?.setFilterValue('all')
                  }
                >
                  {t('header.show.groups.payment-method.values.all')}
                </DropdownMenuCheckboxItem>

                {Object.values(PaymentMethodType)
                  .map((method) => ({
                    label: t(
                      `header.show.groups.payment-method.values.${method}`
                    ),
                    method
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ method, label }) => (
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('paymentMethod')?.getFilterValue() ===
                        method
                      }
                      key={method}
                      onCheckedChange={() =>
                        table.getColumn('paymentMethod')?.setFilterValue(method)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('header.show.groups.product-payment-type.title')}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('productPaymentType')?.getFilterValue() ===
                      'all' ||
                    !table.getColumn('productPaymentType')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('productPaymentType')?.setFilterValue('all')
                  }
                >
                  {t('header.show.groups.product-payment-type.values.all')}
                </DropdownMenuCheckboxItem>

                {Object.values(PaymentProductType)
                  .map((productType) => ({
                    label: t(
                      `header.show.groups.product-payment-type.values.${productType}`
                    ),
                    productType
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ productType, label }) => (
                    <DropdownMenuCheckboxItem
                      checked={
                        table
                          .getColumn('productPaymentType')
                          ?.getFilterValue() === productType
                      }
                      key={productType}
                      onCheckedChange={() =>
                        table
                          .getColumn('productPaymentType')
                          ?.setFilterValue(productType)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
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
                    column.id !== 'searchCreatedAt' &&
                    column.id !== 'searchNextPaymentDate' &&
                    column.id !== 'searchStartDate' && (
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

          <Button
            className='max-sm:flex-1 sm:max-lg:size-9'
            onClick={handleOnClickDownload}
            variant='outline'
          >
            <Download />
            {t('header.actions.values.download')}
          </Button>
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
                          'text-left': [
                            'id',
                            'customerName',
                            'customerEmail',
                            'productName',
                            'membershipId',
                            'parentOrderId',
                            'productId',
                            'extensionId',
                            'nextPaymentDate',
                            'startDate',
                            'createdAt',
                            'updatedAt'
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

      {/* Dialogs */}
      {selectedSubscription && (
        <>
          <CancelSubscriptionDialog
            customerName={selectedSubscription.customerName ?? undefined}
            isOpen={cancelDialogOpen}
            nextPaymentDate={
              selectedSubscription.nextPaymentDate
                ? new Date(selectedSubscription.nextPaymentDate)
                : null
            }
            onCloseDialog={() => {
              setCancelDialogOpen(false)
              setSelectedSubscription(null)
            }}
            subscriptionId={selectedSubscription.id}
            subscriptionType={
              isProductSubscription(selectedSubscription)
                ? 'product'
                : 'extension'
            }
          />

          <SetOnHoldDialog
            customerName={selectedSubscription.customerName ?? undefined}
            isOpen={setOnHoldDialogOpen}
            onCloseDialog={() => {
              setSetOnHoldDialogOpen(false)
              setSelectedSubscription(null)
            }}
            subscriptionId={selectedSubscription.id}
            subscriptionType={
              isProductSubscription(selectedSubscription)
                ? 'product'
                : 'extension'
            }
          />

          <ReschedulePaymentDialog
            currentPaymentDate={
              selectedSubscription.nextPaymentDate
                ? new Date(selectedSubscription.nextPaymentDate)
                : null
            }
            customerName={selectedSubscription.customerName ?? undefined}
            isOpen={rescheduleDialogOpen}
            onCloseDialog={() => {
              setRescheduleDialogOpen(false)
              setSelectedSubscription(null)
            }}
            subscriptionId={selectedSubscription.id}
            subscriptionType={
              isProductSubscription(selectedSubscription)
                ? 'product'
                : 'extension'
            }
          />
        </>
      )}
    </FieldGroup>
  )
}

export function SubscriptionsTableHeader({
  column
}: HeaderContext<Subscription, unknown>) {
  const t = useTranslations(
    'modules.(app).subscriptions._components.subscriptions-table'
  )

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
