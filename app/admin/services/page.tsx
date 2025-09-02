/**
 * Admin Services Management Page
 *
 * This page provides an interface for managing all available services.
 * Features include:
 * - View all services with category filtering
 * - Create, update, and delete services
 * - Toggle service active status
 * - Bulk operations for multiple services
 * - Mobile-responsive design with card/table views
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
  type ColumnDef,
} from '@/components/ui/enhanced-table';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiFilterLine,
  RiMoreLine,
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
  RiBox1Line,
  RiPriceTag3Line,
} from '@remixicon/react';
import AuthGuard from '@/components/providers/auth-guard';
import { ServiceAdminDialog } from '@/components/dialogs/service-admin-dialog';
import { Service, ServiceCategory } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';

interface ServiceWithCategory extends Service {
  category: ServiceCategory;
}

/**
 * Main admin services page component
 * Wraps the content in AuthGuard for authentication
 */
export default function ServicesAdminPage() {
  return (
    <AuthGuard>
      <ServicesPageContent />
    </AuthGuard>
  );
}

/**
 * Main content component for the services admin page
 */
function ServicesPageContent() {
  const isMobile = useIsMobile();

  // Core data state
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selection state for bulk operations
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  // Dialog state
  const [selectedService, setSelectedService] = useState<ServiceWithCategory | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        include_inactive: 'true',
      });

      const response = await fetch(`/api/services?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch services');
      }

      setServices(data.data.services || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/service-categories?include_inactive=true');
      const data = await response.json();

      if (response.ok) {
        setCategories(data.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !service.name.toLowerCase().includes(query) &&
          !service.display_name.toLowerCase().includes(query) &&
          !service.description?.toLowerCase().includes(query) &&
          !service.category?.display_name.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && service.category_id !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !service.is_active) return false;
      if (statusFilter === 'inactive' && service.is_active) return false;

      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [services, searchQuery, categoryFilter, statusFilter]);

  // Handle service save
  const handleServiceSave = async (serviceData: Partial<Service>) => {
    try {
      const isEditing = Boolean(selectedService);
      const url = isEditing ? `/api/services/${selectedService!.id}` : '/api/services';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to ${isEditing ? 'update' : 'create'} service`);
      }

      await fetchServices(); // Refresh services list
      setSelectedService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      throw error;
    }
  };

  // Handle service delete
  const handleServiceDelete = async (service: ServiceWithCategory) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete service');
      }

      await fetchServices(); // Refresh services list
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(`Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle service status toggle
  const handleStatusToggle = async (service: ServiceWithCategory) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !service.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update service status');
      }

      await fetchServices(); // Refresh services list
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error(`Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Bulk operations
  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedServices.size === 0) return;

    try {
      const promises = Array.from(selectedServices).map(serviceId =>
        fetch(`/api/services/${serviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: isActive }),
        })
      );

      await Promise.all(promises);
      await fetchServices();
      setSelectedServices(new Set());
    } catch (error) {
      console.error('Error in bulk status change:', error);
      toast.error('Failed to update some services');
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const handleSelectService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  // Table columns
  const columns: ColumnDef<ServiceWithCategory>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedServices.has(row.original.id)}
          onCheckedChange={() => handleSelectService(row.original.id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'display_name',
      header: ({ column }) => <TableColumnHeader column={column} title="Service" />,
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{service.display_name}</div>
            <div className="text-sm text-muted-foreground truncate">{service.name}</div>
            {service.description && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => <TableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <Status status={isActive ? 'online' : 'offline'} className="text-sm">
            <StatusIndicator />
            <StatusLabel className="ml-2">
              {isActive ? 'Active' : 'Inactive'}
            </StatusLabel>
          </Status>
        );
      },
    },
    {
      accessorKey: 'base_price',
      header: ({ column }) => <TableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div>
            <div className="font-medium">${service.base_price.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground capitalize">
              {service.price_type}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category.display_name',
      header: ({ column }) => <TableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category?.display_name || 'No Category'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <RiMoreLine className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedService(service);
                  setServiceDialogOpen(true);
                }}
              >
                <RiEditLine className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusToggle(service)}>
                {service.is_active ? (
                  <>
                    <RiCloseLine className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <RiCheckLine className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <RiDeleteBinLine className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Service</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete "{service.display_name}"?
                      This action cannot be undone and will remove the service from all future orders.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleServiceDelete(service)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Service
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner variant="circle-filled" size={32} className="mx-auto mb-4" />
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchServices} className="mt-4">
          <RiRefreshLine className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage all available services and their configurations
          </p>
        </div>
        <ServiceAdminDialog
          service={undefined}
          onSave={handleServiceSave}
          trigger={
            <Button>
              <RiAddLine className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          }
        />
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories
                  .filter(category => category.id && category.display_name)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.display_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={fetchServices}
              size="icon"
            >
              <RiRefreshLine className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedServices.size > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedServices.size} service{selectedServices.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(true)}
                >
                  <RiCheckLine className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(false)}
                >
                  <RiCloseLine className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center gap-4 mb-4">
        <Badge variant="outline" className="gap-2">
          <RiBox1Line className="h-4 w-4" />
          {filteredServices.length} Total Services
        </Badge>
        <Badge variant="outline" className="gap-2">
          <RiCheckLine className="h-4 w-4" />
          {filteredServices.filter(s => s.is_active).length} Active
        </Badge>
        <Badge variant="outline" className="gap-2">
          <RiCloseLine className="h-4 w-4" />
          {filteredServices.filter(s => !s.is_active).length} Inactive
        </Badge>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center py-8">
              <RiBox1Line className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'Get started by creating your first service.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile Card View */
        <div className="grid gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={selectedServices.has(service.id)}
                        onCheckedChange={() => handleSelectService(service.id)}
                        aria-label="Select service"
                      />
                      <CardTitle className="text-lg">{service.display_name}</CardTitle>
                      <Status status={service.is_active ? 'online' : 'offline'} className="text-xs">
                        <StatusIndicator />
                        <StatusLabel className="ml-1">
                          {service.is_active ? 'Active' : 'Inactive'}
                        </StatusLabel>
                      </Status>
                    </div>
                    <p className="text-sm text-muted-foreground">{service.name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedService(service);
                          setServiceDialogOpen(true);
                        }}
                      >
                        <RiEditLine className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusToggle(service)}>
                        {service.is_active ? (
                          <>
                            <RiCloseLine className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <RiCheckLine className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <RiDeleteBinLine className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{service.display_name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleServiceDelete(service)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Service
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.description && (
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {service.category?.display_name || 'No Category'}
                    </Badge>
                    <Badge variant="secondary">
                      ${service.base_price.toFixed(2)} {service.price_type}
                    </Badge>
                    {service.dumpster_size && (
                      <Badge variant="secondary">{service.dumpster_size}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <Card>
          <CardContent className="p-0">
            <TableProvider columns={columns} data={filteredServices}>
              <TableHeader>
                {({ headerGroup }) => (
                  <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                    {({ header }) => (
                      <TableHead key={header.id} header={header} />
                    )}
                  </TableHeaderGroup>
                )}
              </TableHeader>
              <TableBody>
                {({ row }) => (
                  <TableRow key={row.id} row={row}>
                    {({ cell }) => (
                      <TableCell key={cell.id} cell={cell} />
                    )}
                  </TableRow>
                )}
              </TableBody>
            </TableProvider>
          </CardContent>
        </Card>
      )}

      {/* Service Edit Dialog */}
      <ServiceAdminDialog
        service={selectedService || undefined}
        isOpen={serviceDialogOpen}
        onClose={() => {
          setServiceDialogOpen(false);
          setSelectedService(null);
        }}
        onSave={handleServiceSave}
      />
    </div>
  );
}