'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronsDown,
  IconDots,
  IconEdit,
  IconEye,
  IconPlus,
  IconSortAscending,
  IconSortDescending,
  IconTrash,
  IconTruck,
  IconX,
} from '@tabler/icons-react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { z } from 'zod';

import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dumpsterSchema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'available':
      return 'default';
    case 'assigned':
      return 'secondary';
    case 'in_transit':
      return 'outline';
    case 'maintenance':
      return 'destructive';
    case 'out_of_service':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <IconCheck className="size-3" />;
    case 'assigned':
      return <IconTruck className="size-3" />;
    case 'in_transit':
      return <IconTruck className="size-3" />;
    case 'maintenance':
      return <IconEdit className="size-3" />;
    case 'out_of_service':
      return <IconX className="size-3" />;
    default:
      return null;
  }
};

const columns = (statuses?: readonly string[]): ColumnDef<z.infer<typeof dumpsterSchema>>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'header',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Dumpster Name
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <DumpsterTableCellViewer item={row.original} statuses={statuses} />;
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Size
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('type')}</div>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Status
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={getStatusBadgeVariant(status)} className="gap-1">
          {getStatusIcon(status)}
          {status.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'target',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Location
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue('target')}</div>,
  },
  {
    accessorKey: 'limit',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Condition
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('limit')}</div>,
  },
  {
    accessorKey: 'reviewer',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 hover:bg-transparent"
        >
          Assignment
          {column.getIsSorted() === 'asc' ? (
            <IconSortAscending className="ml-2 size-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconSortDescending className="ml-2 size-4" />
          ) : (
            <IconChevronsDown className="ml-2 size-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue('reviewer')}</div>,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDots className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <IconEye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit dumpster
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete dumpster
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function DumpsterTableCellViewer({
  item,
  statuses,
}: {
  item: z.infer<typeof dumpsterSchema>;
  statuses?: readonly string[];
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>Dumpster Details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Size</Label>
              <p className="font-medium">{item.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant={getStatusBadgeVariant(item.status)} className="gap-1 w-fit">
                {getStatusIcon(item.status)}
                {item.status.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Current Location</Label>
              <p className="font-medium">{item.target}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Condition</Label>
              <p className="font-medium">{item.limit}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Assignment</Label>
              <p className="font-medium">{item.reviewer || 'Unassigned'}</p>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <div className="flex gap-2">
            <Button className="flex-1">Edit Dumpster</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function DumpstersDataTable({
  data: initialData,
  statuses,
}: {
  data: z.infer<typeof dumpsterSchema>[];
  statuses?: readonly string[];
}) {
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns: columns(statuses),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Group data by status
  const statusTabs = statuses ?
    statuses.map(status => ({
      label: status.replace('_', ' '),
      value: status,
      count: data.filter(item => item.status === status).length,
    })) :
    [
      {
        label: 'available',
        value: 'available',
        count: data.filter(item => item.status === 'available').length,
      },
      {
        label: 'assigned',
        value: 'assigned',
        count: data.filter(item => item.status === 'assigned').length,
      },
      {
        label: 'in transit',
        value: 'in_transit',
        count: data.filter(item => item.status === 'in_transit').length,
      },
      {
        label: 'maintenance',
        value: 'maintenance',
        count: data.filter(item => item.status === 'maintenance').length,
      },
      {
        label: 'out of service',
        value: 'out_of_service',
        count: data.filter(item => item.status === 'out_of_service').length,
      },
    ];

  return (
    <Tabs defaultValue={statusTabs[0]?.value} className="w-full">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Input
              placeholder="Filter dumpsters..."
              value={(table.getColumn('header')?.getFilterValue() as string) ?? ''}
              onChange={event => table.getColumn('header')?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
            <Select
              value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
              onValueChange={value =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusTabs.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconEye />
                  <span className="hidden lg:inline">View</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Add Dumpster</span>
            </Button>
          </div>
        </div>
      </div>

      <TabsList className="mx-4 lg:mx-6">
        {statusTabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            <Badge variant="secondary" className="rounded-full px-1.5 py-0.5 text-xs">
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {statusTabs.map(tab => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead
                          key={header.id}
                          className="px-2 py-3 first:pl-4 last:pr-4"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows
                    .filter(row => row.original.status === tab.value)
                    .map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="px-2 py-1.5 first:pl-4 last:pr-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns(statuses).length} className="h-24 text-center">
                      No dumpsters found with status "{tab.label}".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.filter(row => row.original.status === tab.value).length} row(s) selected.
            </div>
            <div className="flex items-center justify-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={value => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map(pageSize => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronDown className="rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronUp className="rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
