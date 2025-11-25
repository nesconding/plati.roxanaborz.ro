'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  EllipsisVertical,
  Pencil,
  Search,
  View,
  X,
  XCircle
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { useIsMobile } from '~/client/hooks/use-mobile'
import { cn } from '~/client/lib/utils'
import { createXLSXFile } from '~/client/lib/xlsx'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { DatesService } from '~/server/services/dates'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { UserRoles } from '~/shared/enums/user-roles'

type ExtensionOrder =
  TRPCRouterOutput['protected']['extensionOrders']['findAll'][number]
type ProductOrder =
  TRPCRouterOutput['protected']['productOrders']['findAll'][number]

function isProductOrder(
  order: ExtensionOrder | ProductOrder
): order is ProductOrder {
  return order.paymentProductType === PaymentProductType.Product
}

const statusFilter = (
  row: Row<ExtensionOrder | ProductOrder>,
  columnId: string,
  filterValue: OrderStatusType | 'all'
) => {
  if (filterValue === 'all') return true
  const status = row.getValue(columnId) as OrderStatusType
  return status === filterValue
}

const typeFilter = (
  row: Row<ExtensionOrder | ProductOrder>,
  columnId: string,
  filterValue: OrderType | 'all'
) => {
  if (filterValue === 'all') return true
  const type = row.getValue(columnId) as OrderType
  return type === filterValue
}

const productTypeFilter = (
  row: Row<ExtensionOrder | ProductOrder>,
  columnId: string,
  filterValue: PaymentProductType | 'all'
) => {
  if (filterValue === 'all') return true
  const productType = row.getValue(columnId) as PaymentProductType
  return productType === filterValue
}

const formatDate = (date: DateArg<Date> & {}) =>
  format(date, 'PPP - HH:mm', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

interface OrdersTableProps {
  className?: string
  search?: string
}
export function OrdersTable({ className, search }: OrdersTableProps) {
  const t = useTranslations('modules.(app).orders._components.orders-table')

  const isMobile = useIsMobile()
  const router = useRouter()
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

  const trpc = useTRPC()
  const getExtensionOrders = useQuery(
    trpc.protected.extensionOrders.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const queryClient = useQueryClient()
  const getProductOrders = useQuery(
    trpc.protected.productOrders.findAll.queryOptions(undefined, {
      initialData: []
    })
  )
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )
  const updateExtensionOrderStatus = useMutation(
    trpc.protected.extensionOrders.updateStatus.mutationOptions()
  )
  const updateProductOrderStatus = useMutation(
    trpc.protected.productOrders.updateStatus.mutationOptions()
  )

  const data = useMemo(
    () =>
      [...getExtensionOrders.data, ...getProductOrders.data].map((order) => ({
        ...order,
        searchCreatedAt: formatDate(order.createdAt)
      })),
    [getExtensionOrders.data, getProductOrders.data]
  )

  const userEmailFilter = (
    row: Row<ExtensionOrder | ProductOrder>,
    columnId: string,
    filterValue: 'all' | 'users'
  ) => {
    if (filterValue !== 'users') return true

    const customerEmail = row.getValue(columnId) as string
    const isUser = customerEmail === getSession.data?.user?.email
    return isUser
  }

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const handleOnClickUpdateOrderStatusCancel = async (
    id: string,
    status: OrderStatusType,
    paymentProductType: PaymentProductType
  ) => {
    if (
      status === OrderStatusType.Cancelled ||
      status === OrderStatusType.Completed
    ) {
      return
    }

    if (paymentProductType === PaymentProductType.Product) {
      await updateProductOrderStatus.mutateAsync(
        {
          id,
          status: OrderStatusType.Cancelled
        },
        {
          onError: (error) => {
            toast.error(
              t('row.actions.values.cancel-order.product.response.error.title'),
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
                        'row.actions.values.cancel-order.product.response.error.description'
                      )
              }
            )
            console.error(error)
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.productOrders.findAll.queryKey()
            })
            toast.success(
              t(
                'row.actions.values.cancel-order.product.response.success.title'
              ),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'row.actions.values.cancel-order.product.response.success.description'
                )
              }
            )
          }
        }
      )
    }

    if (paymentProductType === PaymentProductType.Extension) {
      await updateExtensionOrderStatus.mutateAsync(
        {
          id,
          status: OrderStatusType.Cancelled
        },
        {
          onError: (error) => {
            toast.error(
              t(
                'row.actions.values.cancel-order.extension.response.error.title'
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
                        'row.actions.values.cancel-order.extension.response.error.description'
                      )
              }
            )
            console.error(error)
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.productOrders.findAll.queryKey()
            })
            toast.success(
              t(
                'row.actions.values.cancel-order.extension.response.success.title'
              ),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'row.actions.values.cancel-order.extension.response.success.description'
                )
              }
            )
          }
        }
      )
    }
  }

  const handleOnClickUpdateOrderStatusProcessBankTransferPayment = async (
    id: string,
    status: OrderStatusType,
    paymentProductType: PaymentProductType
  ) => {
    if (
      status !== OrderStatusType.PendingCardPayment &&
      status !== OrderStatusType.PendingBankTransferPayment
    ) {
      return
    }

    if (paymentProductType === PaymentProductType.Product) {
      await updateProductOrderStatus.mutateAsync(
        {
          id,
          status: OrderStatusType.ProcessingBankTransferPayment
        },
        {
          onError: (error) => {
            toast.error(
              t(
                'row.actions.process-bank-transfer-payment.product.response.error.title'
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
                        'row.actions.process-bank-transfer-payment.product.response.error.description'
                      )
              }
            )
            console.error(error)
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.productOrders.findAll.queryKey()
            })
            toast.success(
              t(
                'row.actions.process-bank-transfer-payment.product.response.success.title'
              ),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'row.actions.process-bank-transfer-payment.product.response.success.description'
                )
              }
            )
          }
        }
      )
    }

    if (paymentProductType === PaymentProductType.Extension) {
      await updateExtensionOrderStatus.mutateAsync(
        {
          id,
          status: OrderStatusType.Cancelled
        },
        {
          onError: (error) => {
            toast.error(
              t('row.actions.cancel-order.extension.response.error.title'),
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
                        'row.actions.cancel-order.extension.response.error.description'
                      )
              }
            )
            console.error(error)
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: trpc.protected.productOrders.findAll.queryKey()
            })
            toast.success(
              t('row.actions.cancel-order.extension.response.success.title'),
              {
                classNames: {
                  description: '!text-muted-foreground',
                  icon: 'text-primary'
                },
                description: t(
                  'row.actions.cancel-order.extension.response.success.description'
                )
              }
            )
          }
        }
      )
    }
  }

  const columns: ColumnDef<ExtensionOrder | ProductOrder>[] = [
    { accessorKey: 'id', header: OrdersTableHeader, id: 'id' },
    {
      accessorKey: 'customerName',
      header: OrdersTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'customerEmail',
      filterFn: userEmailFilter,
      header: OrdersTableHeader,
      id: 'customerEmail'
    },
    {
      accessorKey: 'productName',
      header: OrdersTableHeader,
      id: 'productName'
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          className={cn('capitalize', {
            'bg-green-700 dark:bg-green-500':
              row.original.status === OrderStatusType.Completed
          })}
          variant={
            row.original.status === OrderStatusType.Completed
              ? 'default'
              : row.original.status === OrderStatusType.Cancelled
                ? 'destructive'
                : 'outline'
          }
        >
          {t(`columns.statusValues.${row.original.status}`)}
        </Badge>
      ),
      filterFn: statusFilter,
      header: OrdersTableHeader,
      id: 'status'
    },
    {
      accessorKey: 'type',
      cell: ({ row }) => t(`columns.typeValues.${row.original.type}`),
      filterFn: typeFilter,
      header: OrdersTableHeader,
      id: 'type'
    },
    {
      accessorKey: 'paymentProductType',
      cell: ({ row }) =>
        t(
          `columns.paymentProductTypeValues.${row.original.paymentProductType}`
        ),
      filterFn: productTypeFilter,
      header: OrdersTableHeader,
      id: 'paymentProductType'
    },
    {
      accessorKey: 'paymentLinkId',
      cell: ({ row }) => {
        const paymentLinkId = isProductOrder(row.original)
          ? row.original.productPaymentLinkId
          : row.original.extensionPaymentLinkId

        return (
          <Button asChild className='cursor-pointer' variant='link'>
            <Link
              href={{
                pathname: '/payment-links',
                query: { search: paymentLinkId }
              }}
            >
              {paymentLinkId}
            </Link>
          </Button>
        )
      },
      header: OrdersTableHeader,
      id: 'paymentLinkId'
    },
    {
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className='capitalize'>{formatDate(row.original.createdAt)}</span>
      ),
      header: OrdersTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <span className='capitalize'>{formatDate(row.original.updatedAt)}</span>
      ),
      header: OrdersTableHeader,
      id: 'updatedAt'
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
      accessorKey: 'actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className='relative'
                disabled={
                  row.original.status !== OrderStatusType.PendingCardPayment &&
                  row.original.status !==
                    OrderStatusType.PendingBankTransferPayment
                }
                size='icon'
                variant='ghost'
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {row.original.status ===
                OrderStatusType.PendingBankTransferPayment && (
                <DropdownMenuItem
                  onClick={() => {
                    handleOnClickUpdateOrderStatusProcessBankTransferPayment(
                      row.original.id,
                      row.original.status,
                      row.original.paymentProductType
                    )
                  }}
                >
                  <Pencil />
                  {t('row.actions.values.process-bank-transfer-payment.title')}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() =>
                  handleOnClickUpdateOrderStatusCancel(
                    row.original.id,
                    row.original.status,
                    row.original.paymentProductType
                  )
                }
                variant='destructive'
              >
                <XCircle />
                {t('row.actions.values.cancel-order.title')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableColumnFilter: false,
      enableGlobalFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'actions'
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
      [t('columns.customerName')]: row.customerName ?? '',
      [t('columns.customerEmail')]: row.customerEmail,
      [t('columns.productName')]: row.productName,
      [t('columns.status')]: t(`columns.statusValues.${row.status}`),
      [t('columns.type')]: t(`columns.typeValues.${row.type}`),
      [t('columns.paymentProductType')]: t(
        `columns.paymentProductTypeValues.${row.paymentProductType}`
      ),
      [t('columns.paymentLinkId')]: isProductOrder(row)
        ? (row as Extract<typeof row, { productPaymentLinkId: string }>)
            .productPaymentLinkId
        : (row as Extract<typeof row, { extensionPaymentLinkId: string }>)
            .extensionPaymentLinkId,
      [t('columns.createdAt')]: DatesService.formatDate(row.createdAt),
      [t('columns.updatedAt')]: DatesService.formatDate(row.updatedAt)
    }))

    createXLSXFile(downloadData, `Comenzi - ${formatDate(new Date())}`)
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
                  router.replace('/orders')
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

                {Object.values(OrderStatusType)
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
                  {t('header.show.groups.type.title')}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('type')?.getFilterValue() === 'all' ||
                    !table.getColumn('type')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('type')?.setFilterValue('all')
                  }
                >
                  {t('header.show.groups.type.values.all')}
                </DropdownMenuCheckboxItem>

                {Object.values(OrderType)
                  .map((type) => ({
                    label: t(`header.show.groups.type.values.${type}`),
                    type
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ type, label }) => (
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('type')?.getFilterValue() === type
                      }
                      key={type}
                      onCheckedChange={() =>
                        table.getColumn('type')?.setFilterValue(type)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('header.show.groups.payment-product-type.title')}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('paymentProductType')?.getFilterValue() ===
                      'all' ||
                    !table.getColumn('paymentProductType')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('paymentProductType')?.setFilterValue('all')
                  }
                >
                  {t('header.show.groups.payment-product-type.values.all')}
                </DropdownMenuCheckboxItem>

                {Object.values(PaymentProductType)
                  .map((productType) => ({
                    label: t(
                      `header.show.groups.payment-product-type.values.${productType}`
                    ),
                    productType
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map(({ productType, label }) => (
                    <DropdownMenuCheckboxItem
                      checked={
                        table
                          .getColumn('paymentProductType')
                          ?.getFilterValue() === productType
                      }
                      key={productType}
                      onCheckedChange={() =>
                        table
                          .getColumn('paymentProductType')
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
                            'stripePaymentIntentId',
                            'paymentLinkId',
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
    </FieldGroup>
  )
}

export function OrdersTableHeader({
  column
}: HeaderContext<ExtensionOrder | ProductOrder, unknown>) {
  const t = useTranslations('modules.(app).orders._components.orders-table')

  const handleOnClickColumn = (
    column: Column<ExtensionOrder | ProductOrder>
  ) => {
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
