'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { RiDeleteBinLine } from '@remixicon/react';
import { toast } from 'sonner';

interface ServiceEditDialogProps {
  service: {
    id?: string;
    quote_id?: string;
    order_id?: string;
    quantity: number;
    unit_price: string;
    total_price: string;
    services: {
      display_name: string;
      description?: string;
    };
    is_main_service?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  type: 'quote' | 'order';
}

export function ServiceEditDialog({
  service,
  isOpen,
  onClose,
  onUpdate,
  type,
}: ServiceEditDialogProps) {
  const [quantity, setQuantity] = useState(service.quantity);
  const [unitPrice, setUnitPrice] = useState(parseFloat(service.unit_price));
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalPrice = quantity * unitPrice;
  const tableName = type === 'quote' ? 'quote_services' : 'order_services';
  const idField = type === 'quote' ? 'quote_id' : 'order_id';

  const handleSave = async () => {
    if (!service.id) return;

    // Handle main services differently - only prevent editing for orders
    if (service.is_main_service && type === 'order') {
      toast.info('Main service pricing is typically handled at the quote/order level');
      onClose();
      return;
    }

    // For main services on quotes, we need to create or update a service record
    if (service.is_main_service && type === 'quote') {
      try {
        if (service.id && !service.id.startsWith('main-')) {
          // Update existing service record
          const { error } = await supabase
            .from('quote_services')
            .update({
              quantity,
              unit_price: unitPrice.toString(),
              total_price: totalPrice.toString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', service.id);

          if (error) throw error;
        } else {
          // Create new service record - we need to find or create the service definition
          // First, try to find an existing service with this name
          const { data: serviceDefinition } = await supabase
            .from('services')
            .select('id')
            .eq('display_name', service.services?.display_name || '')
            .single();

          let serviceId;
          if (serviceDefinition) {
            serviceId = serviceDefinition.id;
          } else {
            // Create new service definition
            const { data: newService, error: serviceError } = await supabase
              .from('services')
              .insert({
                display_name: service.services?.display_name || 'Unknown Service',
                description: service.services?.description || 'Main service',
                category: 'main',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (serviceError) throw serviceError;
            serviceId = newService.id;
          }

          // Now create the quote_service record
          const { error } = await supabase.from('quote_services').insert({
            quote_id: service.quote_id,
            service_id: serviceId,
            quantity,
            unit_price: unitPrice.toString(),
            total_price: totalPrice.toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;
        }

        toast.success('Service updated successfully');
        onUpdate();
        onClose();
        return;
      } catch (err) {
        console.error('Error handling main service:', err);
        toast.error('Failed to update main service');
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          quantity,
          unit_price: unitPrice.toString(),
          total_price: totalPrice.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', service.id);

      if (error) {
        console.error('Error updating service:', error);
        toast.error('Failed to update service');
      } else {
        toast.success('Service updated successfully');
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service.id) return;

    // Handle main services differently - only prevent deletion for orders
    if (service.is_main_service && type === 'order') {
      toast.error('Cannot delete main services from orders. Please edit the order directly.');
      setShowDeleteConfirm(false);
      return;
    }

    // For main services on quotes, prevent deletion but allow pricing reset
    if (service.is_main_service && type === 'quote') {
      toast.error('Cannot delete main services. Use pricing to set to $0 if not needed.');
      setShowDeleteConfirm(false);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', service.id);

      if (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to delete service');
      } else {
        toast.success('Service deleted successfully');
        onUpdate();
        onClose();
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the quantity and pricing for {service.services?.display_name || 'this service'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Name */}
            <div>
              <Label className="text-sm font-medium">Service</Label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {service.services?.display_name || 'Unknown Service'}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            {/* Unit Price */}
            <div>
              <Label htmlFor="unit-price" className="text-sm font-medium">
                Unit Price ($)
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="unit-price"
                  type="number"
                  step="10"
                  min="0"
                  value={unitPrice}
                  onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  disabled={service.is_main_service && type === 'order'}
                />
              </div>
              {service.is_main_service && type === 'order' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Main service pricing is managed at the order level
                </p>
              )}
              {service.is_main_service && type === 'quote' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Set the price for this main service
                </p>
              )}
            </div>

            {/* Total Price Display */}
            <div>
              <Label className="text-sm font-medium">Total Price</Label>
              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm font-medium text-green-700">
                {service.is_main_service && type === 'order'
                  ? 'Included in order total'
                  : `$${totalPrice.toFixed(2)}`}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {!service.is_main_service || (service.is_main_service && type === 'quote') ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                disabled={service.is_main_service && type === 'quote'}
              >
                <RiDeleteBinLine className="h-4 w-4 mr-2" />
                {service.is_main_service && type === 'quote' ? 'Cannot Delete' : 'Delete'}
              </Button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {service.is_main_service && type === 'order' ? 'Close' : 'Cancel'}
              </Button>
              {(!service.is_main_service || (service.is_main_service && type === 'quote')) && (
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner variant="circle" size={16} className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{service.services?.display_name || 'this service'}"
              from this {type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Spinner variant="circle" size={16} className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Service'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
