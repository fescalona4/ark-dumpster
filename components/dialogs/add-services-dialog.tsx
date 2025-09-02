'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { RiAddLine, RiDeleteBin2Line } from '@remixicon/react';
import { toast } from 'sonner';

interface Service {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  description: string | null;
  base_price: number;
  price_type: string;
  dumpster_size: string | null;
  category_name: string;
  is_active: boolean;
  sort_order: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  display_name: string;
}

export interface SelectedService {
  service_id: string;
  service: Service;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
}

interface AddServicesDialogProps {
  quoteId?: string;
  orderId?: string;
  onServicesAdded: (services: SelectedService[]) => void;
  existingServices?: SelectedService[];
  type?: 'quote' | 'order';
}

export function AddServicesDialog({
  quoteId,
  orderId,
  onServicesAdded,
  existingServices = [],
  type = 'quote',
}: AddServicesDialogProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(existingServices);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Fetch services and categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchServicesAndCategories();
      fetchExistingServices();
    }
  }, [open]);

  const fetchExistingServices = async () => {
    try {
      const tableName = type === 'quote' ? 'quote_services' : 'order_services';
      const idField = type === 'quote' ? 'quote_id' : 'order_id';
      const entityId = type === 'quote' ? quoteId : orderId;

      if (!entityId) return;

      const { data, error } = await supabase
        .from(tableName)
        .select(
          `
          *,
          services!inner(
            *,
            service_categories!inner(
              name,
              display_name
            )
          )
        `
        )
        .eq(idField, entityId);

      if (error) throw error;

      const existingSelectedServices: SelectedService[] = (data || []).map(serviceRecord => ({
        service_id: serviceRecord.service_id,
        service: {
          ...serviceRecord.services,
          category_name: serviceRecord.services.service_categories.name,
          base_price: parseFloat(serviceRecord.services.base_price),
        },
        quantity: parseFloat(serviceRecord.quantity),
        unit_price: parseFloat(serviceRecord.unit_price),
        total_price: parseFloat(serviceRecord.total_price),
        notes: serviceRecord.notes || '',
      }));

      setSelectedServices(existingSelectedServices);
    } catch (error) {
      console.error(`Error fetching existing ${type} services:`, error);
    }
  };

  const fetchServicesAndCategories = async () => {
    setLoading(true);
    try {
      // Fetch services with category names
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(
          `
          *,
          service_categories!inner(
            id,
            name,
            display_name
          )
        `
        )
        .eq('is_active', true)
        .order('sort_order');

      if (servicesError) throw servicesError;

      // Transform the data to flatten category info
      const transformedServices: Service[] = (servicesData || []).map(service => ({
        ...service,
        category_name: service.service_categories.name,
        base_price: parseFloat(service.base_price),
      }));

      setServices(transformedServices);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const addService = (service: Service) => {
    const isAlreadySelected = selectedServices.some(s => s.service_id === service.id);
    if (isAlreadySelected) {
      toast.error('Service is already added');
      return;
    }

    const newSelectedService: SelectedService = {
      service_id: service.id,
      service: service,
      quantity: 1,
      unit_price: service.base_price,
      total_price: service.base_price,
      notes: '',
    };

    setSelectedServices(prev => [...prev, newSelectedService]);
    toast.success(`${service.display_name} added to ${type}!`);
  };

  const removeService = (serviceId: string) => {
    const serviceToRemove = selectedServices.find(s => s.service_id === serviceId);
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceId));
    
    if (serviceToRemove) {
      toast.success(`${serviceToRemove.service.display_name} removed from ${type}!`);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(prev =>
      prev.map(s =>
        s.service_id === serviceId ? { ...s, quantity, total_price: s.unit_price * quantity } : s
      )
    );
  };

  const updateServiceUnitPrice = (serviceId: string, unitPrice: number) => {
    setSelectedServices(prev =>
      prev.map(s =>
        s.service_id === serviceId
          ? { ...s, unit_price: unitPrice, total_price: unitPrice * s.quantity }
          : s
      )
    );
  };

  const updateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(prev => prev.map(s => (s.service_id === serviceId ? { ...s, notes } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entityId = type === 'quote' ? quoteId : orderId;

      // If we have an entity ID, save to database
      if (entityId) {
        const tableName = type === 'quote' ? 'quote_services' : 'order_services';
        const idField = type === 'quote' ? 'quote_id' : 'order_id';

        // First, delete all existing services for this entity
        await supabase.from(tableName).delete().eq(idField, entityId);

        // Then insert the current selected services
        if (selectedServices.length > 0) {
          const servicesData = selectedServices.map(service => {
            const baseData = {
              [idField]: entityId,
              service_id: service.service_id,
              quantity: service.quantity,
              unit_price: service.unit_price,
              total_price: service.total_price,
              notes: service.notes || null,
              status: type === 'quote' ? 'pending' : 'confirmed',
            };

            // For orders, add additional fields that may be expected
            if (type === 'order') {
              return {
                ...baseData,
                discount_amount: 0,
                service_date: new Date().toISOString().split('T')[0], // Today's date
              };
            }

            return baseData;
          });

          const { error } = await supabase.from(tableName).insert(servicesData);

          if (error) {
            throw error;
          }
        }
      }

      // Call the parent callback with selected services (always, regardless of ID)
      onServicesAdded(selectedServices);
      setOpen(false);
      const entityType = type === 'quote' ? 'quote' : 'order';

      if (entityId) {
        toast.success(
          selectedServices.length > 0
            ? `Services updated successfully for ${entityType}!`
            : `All services removed from ${entityType}!`
        );
      } else {
        toast.success(
          selectedServices.length > 0
            ? `${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''} added to ${entityType}!`
            : `Services cleared from ${entityType}!`
        );
      }
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update services');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices =
    selectedCategoryId === 'all'
      ? services.sort((a, b) => {
        // Show dumpster services first (services with dumpster_size property)
        const aIsDumpster = a.dumpster_size !== null;
        const bIsDumpster = b.dumpster_size !== null;

        if (aIsDumpster && !bIsDumpster) return -1;
        if (!aIsDumpster && bIsDumpster) return 1;

        // Within same category type, sort by original sort_order
        return a.sort_order - b.sort_order;
      })
      : services.filter(s => s.category_id === selectedCategoryId);

  const totalAmount = selectedServices.reduce((sum, s) => sum + s.total_price, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Add Services
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(720px,85vh)] max-w-4xl [&>button:last-child]:top-3.5" aria-describedby="add-services-description">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base">
            Add Services to {type === 'quote' ? 'Quote' : 'Order'}
          </DialogTitle>
          <div className="overflow-y-auto">
            <div className="px-6 py-4">
              <p id="add-services-description" className="text-sm text-muted-foreground mb-6">
                Select services from the available options below and configure quantities and pricing as needed.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner variant="circle-filled" size={32} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="category-filter" className="text-foreground">Filter by Category</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger id="category-filter" className="w-full" aria-label="Filter services by category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Available Services */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Available Services</Label>
                    <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {filteredServices.map(service => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => addService(service)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{service.display_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {categories.find(c => c.id === service.category_id)?.display_name}
                              </Badge>
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${service.base_price < 0 ? 'text-green-600' : ''}`}>
                              ${service.base_price < 0 ? service.base_price : service.base_price}
                            </div>
                            <div className="text-xs text-muted-foreground">{service.price_type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground">Selected Services</Label>
                      <div className="space-y-3 border rounded-md p-3">
                        {selectedServices.map(selectedService => (
                          <div
                            key={selectedService.service_id}
                            className="grid gap-3 p-3 bg-muted/30 rounded-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{selectedService.service?.display_name || 'Unknown'}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeService(selectedService.service_id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label={`Remove ${selectedService.service?.display_name || 'service'} from selection`}
                              >
                                <RiDeleteBin2Line className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-foreground">Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={selectedService.quantity}
                                  onChange={e =>
                                    updateServiceQuantity(
                                      selectedService.service_id,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="h-9"
                                  aria-label={`Quantity for ${selectedService.service?.display_name || 'service'}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-foreground">Unit Price ($)</Label>
                                <Input
                                  type="number"
                                  step="10"
                                  value={selectedService.unit_price}
                                  onChange={e =>
                                    updateServiceUnitPrice(
                                      selectedService.service_id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-9"
                                  aria-label={`Unit price for ${selectedService.service?.display_name || 'service'}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-foreground">Total</Label>
                                <Input
                                  type="text"
                                  value={`$${selectedService.total_price.toFixed(2)}`}
                                  readOnly
                                  className={`h-9 bg-muted ${selectedService.total_price < 0 ? 'text-green-600' : ''}`}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs text-foreground">Notes (optional)</Label>
                              <Textarea
                                value={selectedService.notes}
                                onChange={e =>
                                  updateServiceNotes(selectedService.service_id, e.target.value)
                                }
                                placeholder="Additional notes for this service..."
                                className="h-20 text-sm"
                              />
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center font-medium">
                            <span>Total Amount:</span>
                            <span className={`text-lg ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="border-t px-6 py-4 sm:items-center">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedServices.length === 0}>
            {saving ? (
              <>
                <Spinner variant="circle" size={16} className="mr-2" />
                Adding Services...
              </>
            ) : (
              `Add ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''} to ${type === 'quote' ? 'Quote' : 'Order'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
