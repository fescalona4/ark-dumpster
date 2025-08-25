'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  IconCheck,
  IconDots,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
  IconTruck,
  IconX,
  IconUnlink,
} from '@tabler/icons-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export const dumpsterSchema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
  distance: z.string().optional(),
  sortableDistance: z.number().optional(),
});

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'available':
      return 'outline';
    case 'in_use':
    case 'assigned':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30';
    case 'in_use':
    case 'assigned':
      return 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700';
    default:
      return '';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <IconCheck className="size-3" />;
    case 'in_use':
    case 'assigned':
      return <IconTruck className="size-3" />;
    default:
      return null;
  }
};

function DumpsterCard({
  item,
  statuses,
  onEdit,
  onDelete,
  onUnassign
}: {
  item: z.infer<typeof dumpsterSchema>;
  statuses?: readonly string[];
  onEdit?: (data: EditDumpsterData) => void;
  onDelete?: (id: number) => void;
  onUnassign?: (id: number) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.header}</CardTitle>
          <Badge variant={getStatusBadgeVariant(item.status)} className={`gap-1 ${getStatusBadgeClasses(item.status)}`}>
            {getStatusIcon(item.status)}
            {item.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label className="text-muted-foreground text-xs">Size</Label>
            <p className="font-medium">{item.type}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Condition</Label>
            <p className="font-medium">{item.limit}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Distance from ARK-HOME</Label>
            <p className="font-medium text-blue-600">{item.distance || 'Unknown'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Assignment</Label>
            <p className="text-muted-foreground">{item.reviewer || 'Unassigned'}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground text-xs">Location</Label>
            <p className="text-muted-foreground">{item.target}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Drawer direction={isMobile ? 'bottom' : 'right'}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 mr-2">
                <IconEye className="mr-1 h-4 w-4" />
                View Details
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
                    <Badge variant={getStatusBadgeVariant(item.status)} className={`gap-1 w-fit ${getStatusBadgeClasses(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Distance from ARK-HOME</Label>
                    <p className="font-medium text-blue-600">{item.distance || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Condition</Label>
                    <p className="font-medium">{item.limit}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Current Location</Label>
                    <p className="font-medium">{item.target}</p>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <EditDumpsterDialog item={item} onEdit={onEdit} />}
              {onUnassign && item.reviewer !== 'Unassigned' && (
                <UnassignDumpsterDialog item={item} onUnassign={onUnassign} />
              )}
              <DropdownMenuSeparator />
              {onDelete && <DeleteDumpsterDialog item={item} onDelete={onDelete} />}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}


interface AddDumpsterData {
  name: string;
  size: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  notes: string;
}

function AddDumpsterDialog({ onAdd }: { onAdd: (data: AddDumpsterData) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<AddDumpsterData>({
    name: '',
    size: '',
    condition: 'excellent',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onAdd(formData);
      setFormData({
        name: '',
        size: '',
        condition: 'excellent',
        notes: '',
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconPlus />
          <span className="hidden lg:inline">Add Dumpster</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Dumpster</DialogTitle>
          <DialogDescription>
            Enter the details for the new dumpster. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., D001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 yard">10 yard</SelectItem>
                <SelectItem value="15 yard">15 yard</SelectItem>
                <SelectItem value="20 yard">20 yard</SelectItem>
                <SelectItem value="30 yard">30 yard</SelectItem>
                <SelectItem value="40 yard">40 yard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={formData.condition} onValueChange={(value: 'excellent' | 'good' | 'fair' | 'needs_repair') => setFormData({ ...formData, condition: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs_repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the dumpster..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Dumpster</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditDumpsterData {
  id: number;
  name: string;
  size: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  notes: string;
}

function EditDumpsterDialog({ 
  item, 
  onEdit 
}: { 
  item: z.infer<typeof dumpsterSchema>; 
  onEdit: (data: EditDumpsterData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<EditDumpsterData>({
    id: item.id,
    name: item.header,
    size: item.type,
    condition: item.limit as 'excellent' | 'good' | 'fair' | 'needs_repair',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onEdit(formData);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit dumpster
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Dumpster</DialogTitle>
          <DialogDescription>
            Update the dumpster details. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., D001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-size">Size</Label>
            <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 yard">10 yard</SelectItem>
                <SelectItem value="15 yard">15 yard</SelectItem>
                <SelectItem value="20 yard">20 yard</SelectItem>
                <SelectItem value="30 yard">30 yard</SelectItem>
                <SelectItem value="40 yard">40 yard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-condition">Condition</Label>
            <Select value={formData.condition} onValueChange={(value: 'excellent' | 'good' | 'fair' | 'needs_repair') => setFormData({ ...formData, condition: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs_repair">Needs Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the dumpster..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnassignDumpsterDialog({
  item,
  onUnassign
}: {
  item: z.infer<typeof dumpsterSchema>;
  onUnassign: (id: number) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <IconUnlink className="mr-2 h-4 w-4" />
          Unassign dumpster
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unassign Dumpster</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unassign "{item.header}" from {item.reviewer}? The dumpster will be marked as available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onUnassign(item.id)}
          >
            Unassign
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteDumpsterDialog({
  item,
  onDelete
}: {
  item: z.infer<typeof dumpsterSchema>;
  onDelete: (id: number) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
          <IconTrash className="mr-2 h-4 w-4" />
          Delete dumpster
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Dumpster</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{item.header}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(item.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DumpstersDataTable({
  data: initialData,
  statuses,
  onAdd,
  onEdit,
  onDelete,
  onUnassign,
}: {
  data: z.infer<typeof dumpsterSchema>[];
  statuses?: readonly string[];
  onAdd?: (data: AddDumpsterData) => void;
  onEdit?: (data: EditDumpsterData) => void;
  onDelete?: (id: number) => void;
  onUnassign?: (id: number) => void;
}) {
  const [data] = useState(initialData);

  // Group data by status
  const statusOnlyTabs = statuses ?
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
        label: 'in use',
        value: 'in_use',
        count: data.filter(item => item.status === 'in_use').length,
      },
    ];

  // Add "All" option as the first tab
  const statusTabs = [
    {
      label: 'all',
      value: 'all',
      count: data.length,
    },
    ...statusOnlyTabs,
  ];

  const [currentView, setCurrentView] = useState('all');

  const getStatusOptions = () => {
    return statusTabs.map(tab => (
      <SelectItem key={tab.value} value={tab.value}>
        {tab.label} ({tab.count})
      </SelectItem>
    ));
  };

  // Filter data based on status
  const getFilteredData = (status: string) => {
    return data.filter(item => {
      const matchesStatus = status === 'all' || item.status === status;
      return matchesStatus;
    });
  };

  return (
    <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Select value={currentView} onValueChange={setCurrentView}>
              <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions()}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {onAdd && <AddDumpsterDialog onAdd={onAdd} />}
          </div>
        </div>
      </div>

      <TabsList className="@4xl/main:flex hidden">
        {statusTabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            <Badge variant="secondary" className="rounded-full px-1.5 py-0.5 text-xs">
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {statusTabs.map(tab => {
        const filteredData = getFilteredData(tab.value);

        return (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="relative flex flex-col gap-6"
          >
            {filteredData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredData.map(item => (
                  <DumpsterCard key={item.id} item={item} statuses={statuses} onEdit={onEdit} onDelete={onDelete} onUnassign={onUnassign} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconTruck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No dumpsters found</h3>
                <p className="text-muted-foreground">
                  No dumpsters found with status "{tab.label}".
                </p>
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
