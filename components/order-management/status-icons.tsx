/**
 * Status Icons Component
 * 
 * Provides RemixIcon components for order statuses
 */

import { ReactElement } from 'react';
import {
  RiCalendarLine,
  RiTruckLine,
  RiCheckLine,
  RiCloseLine,
  RiFlagLine,
  RiFileListLine
} from '@remixicon/react';

interface StatusIconProps {
  status: string;
  className?: string;
}

/**
 * Returns the appropriate RemixIcon component for the given status
 */
export function StatusIcon({ status, className = "h-4 w-4" }: StatusIconProps) {
  switch (status) {
    case 'scheduled':
      return <RiCalendarLine className={className} />;
    case 'on_way':
      return <RiTruckLine className={className} />;
    case 'delivered':
      return <RiCheckLine className={className} />;
    case 'on_way_pickup':
      return <RiTruckLine className={className} />;
    case 'completed':
      return <RiFlagLine className={className} />;
    case 'cancelled':
      return <RiCloseLine className={className} />;
    default:
      return <RiFileListLine className={className} />;
  }
}

/**
 * Legacy function that returns a status icon as JSX for backward compatibility
 */
export function getStatusIcon(status: string): ReactElement {
  return <StatusIcon status={status} />;
}
