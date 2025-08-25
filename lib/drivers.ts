/**
 * Driver configuration
 * Add or remove drivers from this list to update the driver selection options
 */
export const DRIVERS = [
  { value: 'Ariel', label: 'Ariel' },
  { value: 'Other', label: 'Other' },
];

// You can also add more driver details if needed in the future
export interface Driver {
  value: string;
  label: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
}

// Export as typed array for future expansion
export const DRIVERS_DETAILED: Driver[] = DRIVERS;