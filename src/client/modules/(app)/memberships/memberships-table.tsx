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
  ArrowRightLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  EllipsisVertical,
  Link2,
  Plus,
  RefreshCw,
  Search,
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
import { useIsMobile } from '~/client/hooks/use-mobile'
import { cn } from '~/client/lib/utils'
import { createXLSXFile } from '~/client/lib/xlsx'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { CreateMembershipDialog } from './_components/create-membership-dialog'
import { ManageLinkedSubscriptionsDialog } from './_components/manage-linked-subscriptions-dialog'
import { TransferMembershipDialog } from './_components/transfer-membership-dialog'
import { UpdateDatesDialog } from './_components/update-dates-dialog'
import { UpdateStatusDialog } from './_components/update-status-dialog'

type Membership =
  TRPCRouterOutput['protected']['memberships']['findAll'][number]

const statusFilter = (
  row: Row<Membership>,
  columnId: string,
  filterValue: MembershipStatusType | 'all'
) => {
  if (filterValue === 'all') return true
  const status = row.getValue(columnId) as MembershipStatusType
  return status === filterValue
}

const formatDate = (
  date: DateArg<Date> & {},
  { withTime = false }: { withTime?: boolean } = {}
) => format(date, withTime ? 'PPP - HH:mm' : 'PPP', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

interface MembershipsTableProps {
  className?: string
  search?: string
}
export function MembershipsTable({ className, search }: MembershipsTableProps) {
  const t = useTranslations()

  const isMobile = useIsMobile()
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'createdAt' }
  ])
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [globalFilter, setGlobalFilter] = useState(search ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    searchCreatedAt: false
  })
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[1]
  })
  const [rowSelection, setRowSelection] = useState({})

  // Dialog states
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false)
  const [updateDatesDialogOpen, setUpdateDatesDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [
    manageLinkedSubscriptionsDialogOpen,
    setManageLinkedSubscriptionsDialogOpen
  ] = useState(false)

  const trpc = useTRPC()
  const getMemberships = useQuery(
    trpc.protected.memberships.findAll.queryOptions(undefined, {
      initialData: []
    })
  )

  const data = useMemo(
    () =>
      getMemberships.data.map((membership) => ({
        ...membership,
        searchCreatedAt: formatDate(membership.createdAt)
      })),
    [getMemberships.data]
  )

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<Membership>[] = [
    { accessorKey: 'id', header: MembershipsTableHeader, id: 'id' },
    {
      accessorKey: 'customerName',
      cell: ({ row }) => row.original.customerName ?? '',
      header: MembershipsTableHeader,
      id: 'customerName'
    },
    {
      accessorKey: 'customerEmail',
      header: MembershipsTableHeader,
      id: 'customerEmail'
    },
    {
      accessorKey: 'productName',
      header: MembershipsTableHeader,
      id: 'productName'
    },
    {
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          className={cn('capitalize', {
            'bg-green-700 dark:bg-green-500':
              row.original.status === MembershipStatusType.Active
          })}
          variant={
            row.original.status === MembershipStatusType.Active
              ? 'default'
              : row.original.status === MembershipStatusType.Paused
                ? 'outline'
                : row.original.status === MembershipStatusType.Cancelled
                  ? 'destructive'
                  : 'outline'
          }
        >
          {t(
            `modules.(app).memberships._components.memberships-table.row.status.${row.original.status}`
          )}
        </Badge>
      ),
      filterFn: statusFilter,
      header: MembershipsTableHeader,
      id: 'status'
    },
    {
      accessorKey: 'startDate',
      cell: ({ row }) =>
        row.original.startDate ? (
          <span className='capitalize'>
            {formatDate(row.original.startDate)}
          </span>
        ) : null,
      header: MembershipsTableHeader,
      id: 'startDate'
    },
    {
      accessorKey: 'delayedStartDate',
      cell: ({ row }) =>
        row.original.delayedStartDate ? (
          <span className='capitalize'>
            {formatDate(row.original.delayedStartDate)}
          </span>
        ) : null,
      header: MembershipsTableHeader,
      id: 'delayedStartDate'
    },
    {
      accessorKey: 'endDate',
      cell: ({ row }) =>
        row.original.endDate ? (
          <span className='capitalize'>{formatDate(row.original.endDate)}</span>
        ) : null,
      header: MembershipsTableHeader,
      id: 'endDate'
    },
    {
      accessorKey: 'parentOrderId',
      cell: ({ row }) =>
        row.original.parentOrderId ? (
          <Button asChild className='cursor-pointer' variant='link'>
            <Link
              href={{
                pathname: '/orders',
                query: {
                  search: row.original.parentOrderId
                }
              }}
            >
              {row.original.parentOrderId}
            </Link>
          </Button>
        ) : null,
      header: MembershipsTableHeader,
      id: 'parentOrderId'
    },
    {
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className='capitalize'>
          {formatDate(row.original.createdAt, { withTime: true })}
        </span>
      ),
      header: MembershipsTableHeader,
      id: 'createdAt'
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <span className='capitalize'>
          {formatDate(row.original.updatedAt, { withTime: true })}
        </span>
      ),
      header: MembershipsTableHeader,
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
      cell: ({ row }) => {
        const membership = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon-sm' variant='ghost'>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>
                {t(
                  'modules.(app).memberships._components.memberships-table.row.actions.label'
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedMembership(membership)
                    setUpdateStatusDialogOpen(true)
                  }}
                >
                  <RefreshCw />
                  {t(
                    'modules.(app).memberships._components.memberships-table.row.actions.update-status'
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedMembership(membership)
                    setUpdateDatesDialogOpen(true)
                  }}
                >
                  <CalendarClock />
                  {t(
                    'modules.(app).memberships._components.memberships-table.row.actions.update-dates'
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedMembership(membership)
                    setTransferDialogOpen(true)
                  }}
                >
                  <ArrowRightLeft />
                  {t(
                    'modules.(app).memberships._components.memberships-table.row.actions.transfer-membership'
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedMembership(membership)
                    setManageLinkedSubscriptionsDialogOpen(true)
                  }}
                >
                  <Link2 />
                  {t(
                    'modules.(app).memberships._components.memberships-table.row.actions.link-subscription'
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableHiding: false,
      enableSorting: false,
      header: () => (
        <span className='sr-only'>
          {t(
            'modules.(app).memberships._components.memberships-table.row.actions.label'
          )}
        </span>
      ),
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

  const fillRows = Array.from(
    {
      length: Math.max(0, pagination.pageSize - table.getRowModel().rows.length)
    },
    (_, index) => index
  )

  function handleOnClickDownload() {
    const downloadData = data.map((row) => ({
      [t('modules.(app).memberships._components.memberships-table.columns.id')]:
        row.id,
      [t(
        'modules.(app).memberships._components.memberships-table.columns.customerName'
      )]: row.customerName ?? '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.customerEmail'
      )]: row.customerEmail,
      [t(
        'modules.(app).memberships._components.memberships-table.columns.productName'
      )]: row.productName,
      [t(
        'modules.(app).memberships._components.memberships-table.columns.status'
      )]: t(
        `modules.(app).memberships._components.memberships-table.row.status.${row.status}`
      ),
      [t(
        'modules.(app).memberships._components.memberships-table.columns.statusValue'
      )]: row.status,
      [t(
        'modules.(app).memberships._components.memberships-table.columns.startDate'
      )]: row.startDate ? formatDate(row.startDate) : '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.startDateValue'
      )]: row.startDate ?? '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.delayedStartDate'
      )]: row.delayedStartDate ? formatDate(row.delayedStartDate) : '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.delayedStartDateValue'
      )]: row.delayedStartDate ?? '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.endDate'
      )]: row.endDate ? formatDate(row.endDate) : '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.endDateValue'
      )]: row.endDate ?? '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.parentOrderId'
      )]: row.parentOrderId ?? '',
      [t(
        'modules.(app).memberships._components.memberships-table.columns.createdAt'
      )]: formatDate(row.createdAt),
      [t(
        'modules.(app).memberships._components.memberships-table.columns.createdAtValue'
      )]: row.createdAt,
      [t(
        'modules.(app).memberships._components.memberships-table.columns.updatedAt'
      )]: formatDate(row.updatedAt),
      [t(
        'modules.(app).memberships._components.memberships-table.columns.updatedAtValue'
      )]: row.updatedAt
    }))

    createXLSXFile(downloadData, `Memberships - ${formatDate(new Date())}`)
  }

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
                'modules.(app).memberships._components.memberships-table.header.input.placeholder'
              )}
              value={searchInput}
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                className={cn({ hidden: searchInput.length === 0 })}
                onClick={() => {
                  setSearchInput('')
                  debouncedSetGlobalFilter('')
                  router.replace('/memberships')
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
                  {t(
                    'modules.(app).memberships._components.memberships-table.header.show.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t(
                    'modules.(app).memberships._components.memberships-table.header.show.groups.status.title'
                  )}
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
                  {t(
                    'modules.(app).memberships._components.memberships-table.header.show.groups.status.values.all'
                  )}
                </DropdownMenuCheckboxItem>
                {Object.values(MembershipStatusType)
                  .map((status) => ({
                    label: t(
                      `modules.(app).memberships._components.memberships-table.header.show.groups.status.values.${status}`
                    ),
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
                    'modules.(app).memberships._components.memberships-table.header.columns.title'
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
                          `modules.(app).memberships._components.memberships-table.columns.${column.id}`
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
                    'modules.(app).memberships._components.memberships-table.header.actions.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}>
                <Plus />
                {t(
                  'modules.(app).memberships._components.memberships-table.header.actions.values.create'
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleOnClickDownload}>
                <Download />
                {t(
                  'modules.(app).memberships._components.memberships-table.header.actions.values.download'
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
                        className={cn('text-center', {
                          'text-left': [
                            'id',
                            'customerName',
                            'customerEmail',
                            'productName',
                            'parentOrderId'
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
                    'modules.(app).memberships._components.memberships-table.no-results'
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
            'modules.(app).memberships._components.memberships-table.pagination.page-count',
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
              'modules.(app).memberships._components.memberships-table.pagination.rows-per-page'
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
                    'modules.(app).memberships._components.memberships-table.pagination.rows-per-page'
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
              'modules.(app).memberships._components.memberships-table.pagination.previous-page'
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
              'modules.(app).memberships._components.memberships-table.pagination.next-page'
            )}
          </span>
          <ChevronRight />
        </Button>
      </div>

      {/* Dialogs */}
      {selectedMembership && (
        <>
          <UpdateStatusDialog
            currentStatus={selectedMembership.status}
            customerName={selectedMembership.customerName ?? undefined}
            isOpen={updateStatusDialogOpen}
            membershipId={selectedMembership.id}
            onCloseDialog={() => {
              setUpdateStatusDialogOpen(false)
              setSelectedMembership(null)
            }}
          />

          <UpdateDatesDialog
            currentDelayedStartDate={
              selectedMembership.delayedStartDate
                ? new Date(selectedMembership.delayedStartDate)
                : null
            }
            currentEndDate={new Date(selectedMembership.endDate)}
            currentStartDate={new Date(selectedMembership.startDate)}
            customerName={selectedMembership.customerName ?? undefined}
            isOpen={updateDatesDialogOpen}
            membershipId={selectedMembership.id}
            onCloseDialog={() => {
              setUpdateDatesDialogOpen(false)
              setSelectedMembership(null)
            }}
          />

          <TransferMembershipDialog
            customerEmail={selectedMembership.customerEmail}
            customerName={selectedMembership.customerName ?? undefined}
            isOpen={transferDialogOpen}
            membershipId={selectedMembership.id}
            onCloseDialog={() => {
              setTransferDialogOpen(false)
              setSelectedMembership(null)
            }}
          />

          <ManageLinkedSubscriptionsDialog
            customerName={selectedMembership.customerName ?? undefined}
            isOpen={manageLinkedSubscriptionsDialogOpen}
            membershipId={selectedMembership.id}
            onCloseDialog={() => {
              setManageLinkedSubscriptionsDialogOpen(false)
              setSelectedMembership(null)
            }}
          />
        </>
      )}

      <CreateMembershipDialog
        isOpen={createDialogOpen}
        onCloseDialog={() => setCreateDialogOpen(false)}
      />
    </FieldGroup>
  )
}

export function MembershipsTableHeader({
  column
}: HeaderContext<Membership, unknown>) {
  const t = useTranslations()

  const handleOnClickColumn = (column: Column<Membership>) => {
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
        `modules.(app).memberships._components.memberships-table.columns.${column.id}`
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
