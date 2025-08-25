"use client"

import * as React from "react"
import { RiArrowDownSLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date | undefined;
  time?: string;
  onDateChange?: (date: Date | undefined) => void;
  onTimeChange?: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  disabled = false
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          {dateLabel}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
              disabled={disabled}
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <RiArrowDownSLine />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(selectedDate) => {
                onDateChange?.(selectedDate)
                setOpen(false)
              }}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          {timeLabel}
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={time || ""}
          onChange={(e) => onTimeChange?.(e.target.value)}
          disabled={disabled}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}

// Keep the original component for backward compatibility
export function Calendar24() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [time, setTime] = React.useState<string>("10:30:00")

  return (
    <DateTimePicker
      date={date}
      time={time}
      onDateChange={setDate}
      onTimeChange={setTime}
    />
  )
}


