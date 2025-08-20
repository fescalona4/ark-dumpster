'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RiBox1Line, RiAlertLine } from '@remixicon/react';
import { Dumpster } from '@/types/dumpster';
import { Order } from '@/types/order';

interface DumpsterAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  dumpsters: Dumpster[];
  onAssign: (orderId: string, dumpsterId: string) => Promise<void>;
  onProceedWithoutDumpster?: () => void;
}

export function DumpsterAssignmentDialog({
  open,
  onOpenChange,
  order,
  dumpsters,
  onAssign,
  onProceedWithoutDumpster
}: DumpsterAssignmentDialogProps) {
  const [selectedDumpsterId, setSelectedDumpsterId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter available dumpsters (excluding ARK-HOME and only available ones)
  const availableDumpsters = dumpsters.filter(
    d => d.name !== 'ARK-HOME' && d.status === 'available'
  );

  const handleAssignAndProceed = async () => {
    if (!selectedDumpsterId) return;

    try {
      setIsAssigning(true);
      await onAssign(order.id, selectedDumpsterId);
      onOpenChange(false);
      setSelectedDumpsterId('');
    } catch (error) {
      console.error('Error assigning dumpster:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleProceedWithout = () => {
    if (onProceedWithoutDumpster) {
      onProceedWithoutDumpster();
    }
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedDumpsterId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RiAlertLine className="h-5 w-5 text-orange-600" />
            Dumpster Assignment Required
          </DialogTitle>
          <DialogDescription>
            Order <strong>{order.order_number}</strong> for <strong>{order.first_name} {order.last_name}</strong>
            doesn't have a dumpster assigned yet. Please select a dumpster to assign before proceeding "On My Way".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Details Summary */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Order Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Size: {order.dumpster_size} Yard</div>
              <div>
                Address: {order.address}
                {order.city && order.state && `, ${order.city}, ${order.state}`}
              </div>
            </div>
          </div>

          {/* Dumpster Selection */}
          <div className="space-y-3">
            <Label htmlFor="dumpster-select" className="text-sm font-medium">
              Select Dumpster to Assign
            </Label>

            {availableDumpsters.length > 0 ? (
              <Select value={selectedDumpsterId} onValueChange={setSelectedDumpsterId}>
                <SelectTrigger id="dumpster-select" className="w-full">
                  <SelectValue placeholder="Choose an available dumpster">
                    {selectedDumpsterId && (
                      <div className="flex items-center gap-2">
                        <RiBox1Line className="h-4 w-4" />
                        <span>
                          {dumpsters.find(d => d.id === selectedDumpsterId)?.name}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableDumpsters.map(dumpster => (
                    <SelectItem key={dumpster.id} value={dumpster.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <RiBox1Line className="h-4 w-4" />
                          <span>{dumpster.name}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {dumpster.size && (
                            <span className="text-xs text-muted-foreground">
                              {dumpster.size} yard
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            Available
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 border rounded-lg border-orange-200 bg-orange-50/50">
                <div className="flex items-center gap-2 text-orange-800">
                  <RiAlertLine className="h-4 w-4" />
                  <span className="text-sm font-medium">No Available Dumpsters</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  All dumpsters are currently assigned to other orders. You may need to proceed without
                  assigning a dumpster or wait for one to become available.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {onProceedWithoutDumpster && (
            <Button variant="secondary" onClick={handleProceedWithout}>
              Proceed Without Dumpster
            </Button>
          )}

          <Button
            onClick={handleAssignAndProceed}
            disabled={!selectedDumpsterId || isAssigning}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isAssigning ? 'Assigning...' : 'Assign & Go On My Way'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}