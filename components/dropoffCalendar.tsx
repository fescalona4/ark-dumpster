'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DropoffCalendarProps {
  value?: string;
  onChange?: (date: string) => void;
}

export function DropoffCalendar({ value, onChange }: DropoffCalendarProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value + 'T00:00:00') : undefined
  );

  React.useEffect(() => {
    if (value) {
      setDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onChange) {
      // Format as YYYY-MM-DD using local timezone to avoid date shifting
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onChange(formattedDate);
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="date" className="px-1">
        Drop-off Date
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="justify-between font-normal text-foreground bg-white h-11 shadow-none"
          >
            {date ? date.toLocaleDateString() : 'Date needed'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            disabled={date => date < new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
