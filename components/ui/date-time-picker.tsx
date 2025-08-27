'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface DateTimePickerProps {
  date?: Date | undefined;
  time?: string;
  onDateTimeChange?: (date: Date | undefined, time: string) => void;
  onDateChange?: (date: Date | undefined) => void;
  onTimeChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
  timeSlots?: Array<{ time: string; available: boolean }>;
}

// Default time slots for business hours (6 AM to 11 PM)
const defaultTimeSlots = [
  { time: '06:00', available: true },
  { time: '06:30', available: true },
  { time: '07:00', available: true },
  { time: '07:30', available: true },
  { time: '08:00', available: true },
  { time: '08:30', available: true },
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: true },
  { time: '10:30', available: true },
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '12:00', available: true },
  { time: '12:30', available: true },
  { time: '13:00', available: true },
  { time: '13:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
  { time: '17:30', available: true },
  { time: '18:00', available: true },
  { time: '18:30', available: true },
  { time: '19:00', available: true },
  { time: '19:30', available: true },
  { time: '20:00', available: true },
  { time: '20:30', available: true },
  { time: '21:00', available: true },
  { time: '21:30', available: true },
  { time: '22:00', available: true },
  { time: '22:30', available: true },
  { time: '23:00', available: true },
];

export function DateTimePicker({
  date: initialDate,
  time: initialTime,
  onDateTimeChange,
  onDateChange,
  onTimeChange,
  disabled = false,
  className = '',
  timeSlots = defaultTimeSlots,
}: DateTimePickerProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);

  // Update internal state when props change
  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    setSelectedTime(initialTime || null);
  }, [initialTime]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    setSelectedTime(null); // Reset time when date changes
    onDateChange?.(newDate);
    if (onDateTimeChange) {
      onDateTimeChange(newDate, '');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeChange?.(time);
    if (onDateTimeChange && selectedDate) {
      onDateTimeChange(selectedDate, time);
    }
  };

  return (
    <div className={`rounded-md border ${className}`}>
      <div className="flex max-sm:flex-col">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="p-2 sm:pe-5"
          disabled={disabled ? true : [{ before: today }]}
        />
        <div className="relative w-full max-sm:h-48 sm:w-40">
          <div className="absolute inset-0 py-4 max-sm:border-t">
            <div className="h-full sm:border-s overflow-y-auto">
              <div className="space-y-3">
                <div className="flex h-5 shrink-0 items-center px-5">
                  <p className="text-sm font-medium">
                    {selectedDate ? format(selectedDate, 'EEEE, d') : 'Select date'}
                  </p>
                </div>
                <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                  {timeSlots.map(({ time: timeSlot, available }) => {
                    // Convert 24-hour time to 12-hour AM/PM format for display
                    const [hours, minutes] = timeSlot.split(':');
                    const hour12 = parseInt(hours) % 12 || 12;
                    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                    const displayTime = `${hour12}:${minutes} ${ampm}`;

                    return (
                      <Button
                        key={timeSlot}
                        variant={selectedTime === timeSlot ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => handleTimeSelect(timeSlot)}
                        disabled={disabled || !available || !selectedDate}
                      >
                        {displayTime}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep the original component for backward compatibility
export default function Component() {
  const today = new Date();
  const [date, setDate] = useState<Date>(today);
  const [time, setTime] = useState<string>('');

  return (
    <div>
      <DateTimePicker
        date={date}
        time={time}
        onDateTimeChange={(newDate, newTime) => {
          if (newDate) setDate(newDate);
          setTime(newTime);
        }}
      />
      <p
        className="text-muted-foreground mt-4 text-center text-xs"
        role="region"
        aria-live="polite"
      >
        Selected: {date ? format(date, 'PPP') : 'No date'} {time && `at ${time}`}
      </p>
    </div>
  );
}
