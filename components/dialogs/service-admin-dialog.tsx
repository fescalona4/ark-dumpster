'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Service, ServiceCategory, ServicePriceType } from '@/types/database';
import { RiAddLine, RiEditLine } from '@remixicon/react';

interface ServiceAdminDialogProps {
  service?: Service;
  isOpen?: boolean;
  onClose?: () => void;
  onSave: (serviceData: Partial<Service>) => Promise<void>;
  trigger?: React.ReactNode;
}

const PRICE_TYPES: { value: ServicePriceType; label: string }[] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Per Hour' },
  { value: 'daily', label: 'Per Day' },
  { value: 'weekly', label: 'Per Week' },
  { value: 'custom', label: 'Custom' },
];

const DUMPSTER_SIZES = [
  '10-yard',
  '15-yard',
  '20-yard',
  '30-yard',
];

export function ServiceAdminDialog({
  service,
  isOpen,
  onClose,
  onSave,
  trigger,
}: ServiceAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    display_name: '',
    description: '',
    category_id: '',
    sku: '',
    base_price: 0,
    price_type: 'fixed',
    dumpster_size: null,
    included_days: null,
    extra_day_price: null,
    included_weight_tons: null,
    extra_weight_price_per_ton: null,
    is_active: true,
    requires_scheduling: false,
    max_quantity: null,
    is_taxable: true,
    tax_rate: 0,
    sort_order: 0,
    metadata: null,
  });

  const isEditing = Boolean(service);
  const dialogOpen = isOpen !== undefined ? isOpen : open;
  const setDialogOpen = isOpen !== undefined ? (open: boolean) => {
    if (!open && onClose) onClose();
  } : setOpen;

  // Fetch categories when dialog opens
  useEffect(() => {
    if (dialogOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [dialogOpen]);

  // Populate form when editing
  useEffect(() => {
    if (service && dialogOpen) {
      setFormData({
        name: service.name,
        display_name: service.display_name,
        description: service.description,
        category_id: service.category_id,
        sku: service.sku,
        base_price: service.base_price,
        price_type: service.price_type,
        dumpster_size: service.dumpster_size,
        included_days: service.included_days,
        extra_day_price: service.extra_day_price,
        included_weight_tons: service.included_weight_tons,
        extra_weight_price_per_ton: service.extra_weight_price_per_ton,
        is_active: service.is_active,
        requires_scheduling: service.requires_scheduling,
        max_quantity: service.max_quantity,
        is_taxable: service.is_taxable,
        tax_rate: service.tax_rate,
        sort_order: service.sort_order,
        metadata: service.metadata,
      });
    } else if (!isEditing && dialogOpen) {
      // Reset form for new service
      setFormData({
        name: '',
        display_name: '',
        description: '',
        category_id: '',
        sku: '',
        base_price: 0,
        price_type: 'fixed',
        dumpster_size: null,
        included_days: null,
        extra_day_price: null,
        included_weight_tons: null,
        extra_weight_price_per_ton: null,
        is_active: true,
        requires_scheduling: false,
        max_quantity: null,
        is_taxable: true,
        tax_rate: 0,
        sort_order: 0,
        metadata: null,
      });
    }
  }, [service, isEditing, dialogOpen]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/service-categories?include_inactive=true');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.name?.trim()) {
        alert('Name is required');
        return;
      }
      if (!formData.display_name?.trim()) {
        alert('Display name is required');
        return;
      }
      if (!formData.category_id) {
        alert('Category is required');
        return;
      }
      if (formData.base_price === undefined) {
        alert('Base price is required');
        return;
      }

      await onSave(formData);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof Service, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const dialogContent = (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit Service' : 'Create New Service'}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the service information below.'
            : 'Fill in the details to create a new service.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="internal-service-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => updateFormData('display_name', e.target.value)}
                placeholder="Customer-facing name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Service description for customers"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id || ''}
                onValueChange={(value) => updateFormData('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : (
                    categories
                      .filter(category => category.id && category.display_name)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.display_name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => updateFormData('sku', e.target.value)}
                placeholder="Optional SKU"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price *</Label>
              <Input
                id="base_price"
                type="number"
                step="10"
                value={formData.base_price || 0}
                onChange={(e) => updateFormData('base_price', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_type">Price Type</Label>
              <Select
                value={formData.price_type || 'fixed'}
                onValueChange={(value) => updateFormData('price_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dumpster-Specific Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dumpster-Specific Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dumpster_size">Dumpster Size</Label>
              <Select
                value={formData.dumpster_size || 'none'}
                onValueChange={(value) => updateFormData('dumpster_size', value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {DUMPSTER_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="included_days">Included Days</Label>
              <Input
                id="included_days"
                type="number"
                min="0"
                value={formData.included_days || ''}
                onChange={(e) => updateFormData('included_days', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extra_day_price">Extra Day Price</Label>
              <Input
                id="extra_day_price"
                type="number"
                min="0"
                step="10"
                value={formData.extra_day_price || ''}
                onChange={(e) => updateFormData('extra_day_price', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="included_weight_tons">Included Weight (tons)</Label>
              <Input
                id="included_weight_tons"
                type="number"
                min="0"
                step="10"
                value={formData.included_weight_tons || ''}
                onChange={(e) => updateFormData('included_weight_tons', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra_weight_price">Extra Weight Price (per ton)</Label>
            <Input
              id="extra_weight_price"
              type="number"
              min="0"
              step="10"
              value={formData.extra_weight_price_per_ton || ''}
              onChange={(e) => updateFormData('extra_weight_price_per_ton', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
        </div>

        {/* Service Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Service Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_quantity">Max Quantity</Label>
              <Input
                id="max_quantity"
                type="number"
                min="1"
                value={formData.max_quantity || ''}
                onChange={(e) => updateFormData('max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order || 0}
                onChange={(e) => updateFormData('sort_order', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              min="0"
              max="100"
              step="10"
              value={formData.tax_rate || 0}
              onChange={(e) => updateFormData('tax_rate', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateFormData('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_scheduling"
                checked={formData.requires_scheduling}
                onCheckedChange={(checked) => updateFormData('requires_scheduling', checked)}
              />
              <Label htmlFor="requires_scheduling">Requires Scheduling</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_taxable"
                checked={formData.is_taxable}
                onCheckedChange={(checked) => updateFormData('is_taxable', checked)}
              />
              <Label htmlFor="is_taxable">Taxable</Label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setDialogOpen(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Spinner variant="circle-filled" size={16} className="mr-2" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEditing ? 'Update Service' : 'Create Service'}
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (isOpen !== undefined) {
    return <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>{dialogContent}</Dialog>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <RiAddLine className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </DialogTrigger>
      )}
      {dialogContent}
    </Dialog>
  );
}