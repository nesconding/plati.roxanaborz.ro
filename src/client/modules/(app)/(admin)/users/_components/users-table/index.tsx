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
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import {
  BadgeCheck,
  BadgeX,
  Ban,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  EllipsisVertical,
  LockOpen,
  Pencil,
  Search,
  ShieldPlus,
  ShieldX,
  Trash,
  Upload,
  UserRoundPlus,
  View,
  X,
  Zap
} from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Button } from '~/client/components/ui/button'
import { Checkbox } from '~/client/components/ui/checkbox'
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
// import { createXLSXFile } from '~/client/lib/xlsx'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { UserRoles } from '~/shared/enums/user-roles'

type User = TRPCRouterOutput['admin']['authentication']['listUsers'][number]

const formatDate = (date: DateArg<Date> & {}) =>
  format(date, 'PPP - HH:mm', { locale: ro })

const pageSizeOptions = [10, 25, 50, 75, 100]

const invitedByFilter = (
  row: Row<User>,
  columnId: string,
  filterValue: 'all' | 'by-me',
  currentUserId: string
) => {
  if (filterValue === 'all') return true

  const invitedById = row.getValue(columnId) as string | null
  return invitedById === currentUserId
}

const userRoleFilter = (
  row: Row<User>,
  columnId: string,
  filterValue: 'all' | 'only-admins' | 'without-admins'
) => {
  if (filterValue === 'all') return true

  const role = row.getValue(columnId) as UserRoles

  if (filterValue === 'only-admins') {
    return role === UserRoles.ADMIN || role === UserRoles.SUPER_ADMIN
  }

  return role === UserRoles.USER
}

const bannedStatusFilter = (
  row: Row<User>,
  columnId: string,
  filterValue: 'all' | 'only-banned' | 'not-banned'
) => {
  if (filterValue === 'all') return true

  const banned = row.getValue(columnId) as boolean | null

  if (filterValue === 'only-banned') {
    return banned === true
  }

  return !banned
}

interface UsersTableProps {
  className?: string
  search?: string
  onCreateUser?: () => void
  onPromoteUser?: (user: User) => void
  onDemoteUser?: (user: User) => void
  onEditUser?: (user: User) => void
  onExportUsers?: (users: User[]) => void
  onImportUsers?: () => void
  onUnbanUser?: (user: User) => void
  onBanUser?: (user: User) => void
  onRemoveUsers?: (users: User[]) => void
}
export function UsersTable({
  className,
  search,
  onCreateUser,
  onPromoteUser,
  onDemoteUser,
  onEditUser,
  onExportUsers,
  onImportUsers,
  onUnbanUser,
  onBanUser,
  onRemoveUsers
}: UsersTableProps) {
  const t = useTranslations()

  const isMobile = useIsMobile()
  const pathname = usePathname()
  const router = useRouter()

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: 'role' }
  ])
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [globalFilter, setGlobalFilter] = useState(search ?? '')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    banExpires: false,
    createdAt: false,
    id: false,
    name: false,
    updatedAt: false
  })
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0]
  })
  const [rowSelection, setRowSelection] = useState({})

  const trpc = useTRPC()
  const listUsers = useQuery(
    trpc.admin.authentication.listUsers.queryOptions(undefined, {
      initialData: []
    })
  )
  const getSession = useQuery(
    trpc.public.authentication.getSession.queryOptions()
  )

  const data = useMemo(
    () =>
      listUsers.data.map((user) => ({
        ...user,
        searchBanExpires: user.banExpires ? formatDate(user.banExpires) : '',
        searchBanned: user.banned
          ? t(
              'modules.(app).(admin).users._components.users-table.row.banned.values.banned'
            )
          : '',
        searchCreatedAt: formatDate(user.createdAt)
      })),
    [listUsers.data, t]
  )

  const debouncedSetGlobalFilter = useDebouncedCallback(setGlobalFilter, 500)

  const columns: ColumnDef<User>[] = [
    {
      cell: ({ row }) => (
        <Checkbox
          aria-label='Select row'
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label='Select all'
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        />
      ),
      id: 'select'
    },
    {
      accessorKey: 'id',
      header: UsersTableHeader
    },
    {
      accessorKey: 'lastName',
      header: UsersTableHeader
    },
    {
      accessorKey: 'firstName',
      header: UsersTableHeader
    },
    {
      accessorKey: 'name',
      header: UsersTableHeader
    },
    {
      accessorKey: 'email',
      header: UsersTableHeader
    },
    {
      accessorKey: 'emailVerified',
      cell: ({ row }) => (
        <span className='flex justify-center'>
          {row.original.emailVerified ? (
            <BadgeCheck className='size-4' />
          ) : (
            <BadgeX className='size-4' />
          )}
        </span>
      ),
      header: UsersTableHeader
    },
    {
      accessorKey: 'phoneNumber',
      cell: ({ row }) =>
        row.original.phoneNumber
          ? parsePhoneNumberFromString(
              row.original.phoneNumber
            )?.formatInternational()
          : '-',
      header: UsersTableHeader
    },
    {
      accessorKey: 'role',
      cell: ({ row }) => (
        <span className='capitalize'>
          {t(
            `modules.(app).(admin).users._components.users-table.row.role.values.${row.original.role}`
          )}
        </span>
      ),
      filterFn: userRoleFilter,
      header: UsersTableHeader
    },
    {
      accessorKey: 'banned',
      cell: ({ row }) => (
        <span className='capitalize'>
          {row.original.banned ? (
            row.original.banReason === 'No reason' ? (
              <span className='font-medium'>
                {t(
                  'modules.(app).(admin).users._components.users-table.row.banned.values.banned'
                )}
              </span>
            ) : (
              <Tooltip>
                <TooltipTrigger className='font-semibold underline'>
                  {t(
                    'modules.(app).(admin).users._components.users-table.row.banned.values.banned'
                  )}
                </TooltipTrigger>
                <TooltipContent className='max-w-xs'>
                  {row.original.banReason}
                </TooltipContent>
              </Tooltip>
            )
          ) : (
            '-'
          )}
        </span>
      ),
      filterFn: bannedStatusFilter,
      header: UsersTableHeader
    },
    {
      accessorKey: 'searchBanned',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchBanned'
    },
    {
      accessorKey: 'banExpires',
      cell: ({ row }) => (
        <span className='flex justify-center'>
          <span className='text-center capitalize'>
            {row.original.banExpires
              ? formatDate(row.original.banExpires)
              : '-'}
          </span>
        </span>
      ),
      header: UsersTableHeader
    },
    {
      accessorKey: 'searchBanExpires',
      cell: () => null,
      enableColumnFilter: false,
      enableHiding: false,
      enableSorting: false,
      header: () => null,
      id: 'searchBanExpires'
    },
    {
      accessorKey: 'invitedBy.name',
      cell: ({ row }) => (
        <span className='capitalize'>{row.original.invitedBy?.name}</span>
      ),
      header: UsersTableHeader
    },
    {
      accessorKey: 'invitedById',
      cell: () => null,
      enableColumnFilter: true,
      enableHiding: false,
      enableSorting: false,
      filterFn: (row, columnId, filterValue) =>
        invitedByFilter(
          row,
          columnId,
          filterValue,
          getSession.data?.user.id ?? ''
        ),
      header: () => null,
      id: 'invitedById'
    },
    {
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className='capitalize'>{formatDate(row.original.createdAt)}</span>
      ),
      header: UsersTableHeader,
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
    },
    {
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <span className='capitalize'>{formatDate(row.original.updatedAt)}</span>
      ),
      header: UsersTableHeader
    },
    {
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost'>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={
                    row.original.role === UserRoles.SUPER_ADMIN ||
                    (row.original.role === UserRoles.ADMIN &&
                      getSession.data?.user.role !== UserRoles.SUPER_ADMIN)
                  }
                  onClick={() => onEditUser?.(row.original)}
                >
                  <Pencil />
                  <span className='w-full'>
                    {t(
                      'modules.(app).(admin).users._components.users-table.row.actions.edit-user'
                    )}
                  </span>
                </DropdownMenuItem>

                {getSession.data?.user.role === UserRoles.SUPER_ADMIN &&
                row.original.role === UserRoles.USER ? (
                  <DropdownMenuItem
                    disabled={
                      getSession.data?.user.role !== UserRoles.SUPER_ADMIN
                    }
                    onClick={() => onPromoteUser?.(row.original)}
                  >
                    <ShieldPlus />
                    <span className='w-full'>
                      {t(
                        'modules.(app).(admin).users._components.users-table.row.actions.promote-to-admin'
                      )}
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={
                      row.original.role === UserRoles.SUPER_ADMIN ||
                      getSession.data?.user.role !== UserRoles.SUPER_ADMIN
                    }
                    onClick={() => onDemoteUser?.(row.original)}
                  >
                    <ShieldX />
                    <span className='w-full'>
                      {t(
                        'modules.(app).(admin).users._components.users-table.row.actions.demote-to-user'
                      )}
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuGroup>
                {row.original.banned ? (
                  <DropdownMenuItem
                    disabled={
                      row.original.role === UserRoles.SUPER_ADMIN ||
                      (row.original.role === UserRoles.ADMIN &&
                        getSession.data?.user.role !== UserRoles.SUPER_ADMIN)
                    }
                    onClick={() => onUnbanUser?.(row.original)}
                  >
                    <LockOpen />
                    <span className='w-full'>
                      {t(
                        'modules.(app).(admin).users._components.users-table.row.actions.unban-user'
                      )}
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={
                      row.original.role === UserRoles.SUPER_ADMIN ||
                      (row.original.role === UserRoles.ADMIN &&
                        getSession.data?.user.role !== UserRoles.SUPER_ADMIN)
                    }
                    onClick={() => onBanUser?.(row.original)}
                  >
                    <Ban />
                    <span className='w-full'>
                      {t(
                        'modules.(app).(admin).users._components.users-table.row.actions.ban-user'
                      )}
                    </span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  disabled={
                    row.original.role === UserRoles.SUPER_ADMIN ||
                    (row.original.role === UserRoles.ADMIN &&
                      getSession.data?.user.role !== UserRoles.SUPER_ADMIN)
                  }
                  onClick={() => onRemoveUsers?.([row.original])}
                  variant='destructive'
                >
                  <Trash />
                  <span className='w-full'>
                    {t(
                      'modules.(app).(admin).users._components.users-table.row.actions.remove-user'
                    )}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
      id: 'row-actions'
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

  function handleOnClearSearch() {
    setSearchInput('')
    debouncedSetGlobalFilter('')
    router.replace(pathname)
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
                'modules.(app).(admin).users._components.users-table.header.input.placeholder'
              )}
              value={searchInput}
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                className={searchInput.length > 0 ? '' : 'hidden'}
                onClick={handleOnClearSearch}
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
                    'modules.(app).(admin).users._components.users-table.header.show.title'
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
                        'modules.(app).(admin).users._components.users-table.header.show.groups.invited-by.title'
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('invitedById')?.getFilterValue() ===
                          'all' ||
                        !table.getColumn('invitedById')?.getFilterValue()
                      }
                      onCheckedChange={() =>
                        table.getColumn('invitedById')?.setFilterValue('all')
                      }
                    >
                      {t(
                        'modules.(app).(admin).users._components.users-table.header.show.groups.invited-by.values.all'
                      )}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={
                        table.getColumn('invitedById')?.getFilterValue() ===
                        'by-me'
                      }
                      onCheckedChange={() =>
                        table.getColumn('invitedById')?.setFilterValue('by-me')
                      }
                    >
                      {t(
                        'modules.(app).(admin).users._components.users-table.header.show.groups.invited-by.values.by-me'
                      )}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.admins.title'
                  )}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('role')?.getFilterValue() === 'all' ||
                    !table.getColumn('role')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('role')?.setFilterValue('all')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.admins.values.all'
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('role')?.getFilterValue() === 'only-admins'
                  }
                  onCheckedChange={() =>
                    table.getColumn('role')?.setFilterValue('only-admins')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.admins.values.only-admins'
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('role')?.getFilterValue() ===
                    'without-admins'
                  }
                  onCheckedChange={() =>
                    table.getColumn('role')?.setFilterValue('without-admins')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.admins.values.without-admins'
                  )}
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.banned.title'
                  )}
                </DropdownMenuLabel>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('banned')?.getFilterValue() === 'all' ||
                    !table.getColumn('banned')?.getFilterValue()
                  }
                  onCheckedChange={() =>
                    table.getColumn('banned')?.setFilterValue('all')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.banned.values.all'
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('banned')?.getFilterValue() ===
                    'only-banned'
                  }
                  onCheckedChange={() =>
                    table.getColumn('banned')?.setFilterValue('only-banned')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.banned.values.only-banned'
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn('banned')?.getFilterValue() === 'not-banned'
                  }
                  onCheckedChange={() =>
                    table.getColumn('banned')?.setFilterValue('not-banned')
                  }
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.header.show.groups.banned.values.not-banned'
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
                    'modules.(app).(admin).users._components.users-table.header.columns.title'
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
                          `modules.(app).(admin).users._components.users-table.columns.${column.id}`
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
                    'modules.(app).(admin).users._components.users-table.header.actions.title'
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={onCreateUser}>
                <UserRoundPlus />
                {t(
                  'modules.(app).(admin).users._components.users-table.header.actions.values.create-user'
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onImportUsers}>
                <Upload />
                {t(
                  'modules.(app).(admin).users._components.users-table.header.actions.values.import-users'
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={table.getSelectedRowModel().rows.length === 0}
                onClick={() =>
                  onExportUsers?.(
                    table.getSelectedRowModel().rows.map((row) => row.original)
                  )
                }
              >
                <Download />
                {t(
                  'modules.(app).(admin).users._components.users-table.header.actions.values.export-users'
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={table.getSelectedRowModel().rows.length === 0}
                onClick={() =>
                  onRemoveUsers?.(
                    table.getSelectedRowModel().rows.map((row) => row.original)
                  )
                }
                variant='destructive'
              >
                <Trash />
                {t(
                  'modules.(app).(admin).users._components.users-table.header.actions.values.remove-users'
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
                    // biome-ignore lint/suspicious/noArrayIndexKey: <>
                    <TableRow className='h-14' data-state='false' key={index} />
                  ))}
              </>
            ) : (
              <TableRow>
                <TableCell
                  className='h-[calc(theme(spacing.14)*10)] text-center'
                  colSpan={columns.length}
                >
                  {t(
                    'modules.(app).(admin).users._components.users-table.row.no-results'
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
            'modules.(app).(admin).users._components.users-table.footer.pagination.page-count',
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
              'modules.(app).(admin).users._components.users-table.footer.pagination.rows-per-page'
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
                    'modules.(app).(admin).users._components.users-table.footer.pagination.rows-per-page'
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
              'modules.(app).(admin).users._components.users-table.footer.pagination.previous-page'
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
              'modules.(app).(admin).users._components.users-table.footer.pagination.next-page'
            )}
          </span>
          <ChevronRight />
        </Button>
      </div>
    </FieldGroup>
  )
}

export function UsersTableHeader({ column }: HeaderContext<User, unknown>) {
  const t = useTranslations()

  const handleOnClickColumn = (column: Column<User>) => {
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
        `modules.(app).(admin).users._components.users-table.columns.${column.id}`
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
