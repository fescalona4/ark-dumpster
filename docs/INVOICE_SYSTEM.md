# Invoice System Documentation

## Overview
The invoice system allows administrators to generate, view, and print invoices for dumpster rental orders.

## Features

### 1. Invoice Generation
- Automatic invoice generation for all orders
- Unique invoice numbers based on order ID
- Professional invoice layout with company branding
- Automatic tax calculation (8% rate)
- Payment terms and due dates

### 2. Invoice Access
- **Quick View**: Click "📄 View Invoice" button on any order in the admin orders page to open invoice in a dialog
- **Full Page View**: Click "Full Page" in the dialog or visit `/admin/orders/[orderId]/invoice` directly
- **Print/Download**: Print functionality available in both dialog and full page views

### 3. Invoice Components

#### Invoice Component (`/components/invoice.tsx`)
- Complete invoice layout with customer details, order information, and pricing
- Responsive design optimized for printing
- Includes company branding and contact information

#### Invoice Dialog (`/components/invoice-dialog.tsx`)
- Modal popup for quick invoice viewing
- Print functionality
- Link to full page view

#### Invoice Summary (`/components/invoice-summary.tsx`)
- Compact invoice overview component
- Shows key invoice details in a card format
- Can be used in dashboards or order details

### 4. API Endpoints

#### GET `/api/orders/[orderId]/invoice`
Returns invoice data in JSON format:
```json
{
  "invoiceNumber": "INV-A1B2C3D4",
  "invoiceDate": "2025-08-18T...",
  "dueDate": "2025-09-17T...",
  "order": { ... },
  "subtotal": 500.00,
  "taxRate": 0.08,
  "taxAmount": 40.00,
  "total": 540.00,
  "company": { ... }
}
```

#### POST `/api/orders/[orderId]/invoice`
Future endpoint for saving custom invoice data or settings.

## Usage Examples

### Basic Invoice Display
```tsx
import Invoice from '@/components/invoice';
import { Order } from '@/types/order';

function MyComponent({ order }: { order: Order }) {
  return <Invoice order={order} />;
}
```

### Invoice Dialog
```tsx
import InvoiceDialog from '@/components/invoice-dialog';

function OrderCard({ order }: { order: Order }) {
  return (
    <div>
      <h3>Order {order.order_number}</h3>
      <InvoiceDialog order={order} />
    </div>
  );
}
```

### Invoice Summary Card
```tsx
import InvoiceSummary from '@/components/invoice-summary';

function Dashboard({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <InvoiceSummary order={order} />
      {/* Other components */}
    </div>
  );
}
```

## Customization

### Company Information
Update company details in `/components/invoice.tsx`:
```tsx
const company = {
  name: 'Your Company Name',
  address: 'Your Address',
  // ... other details
};
```

### Tax Rate
Modify the tax rate in invoice components:
```tsx
const taxRate = 0.08; // Change to your local tax rate
```

### Invoice Number Format
Customize invoice number generation:
```tsx
const generateInvoiceNumber = (orderId: string) => {
  return `CUSTOM-${orderId.slice(-6)}`;
};
```

## File Structure
```
components/
├── invoice.tsx           # Main invoice component
├── invoice-dialog.tsx    # Modal popup for invoice
└── invoice-summary.tsx   # Compact invoice summary

app/
├── admin/orders/[orderId]/invoice/
│   └── page.tsx         # Full page invoice view
└── api/orders/[orderId]/invoice/
    └── route.ts         # Invoice API endpoint
```

## Styling
The invoice components use Tailwind CSS with print-optimized styles. The design is responsive and includes:
- Professional layout with company branding
- Proper spacing and typography for readability
- Print-friendly styles that work across browsers
- Clean table layout for service details
- Branded color scheme matching the application

## Future Enhancements
- Email invoice delivery
- PDF generation
- Custom invoice templates
- Bulk invoice operations
- Invoice payment tracking
- Invoice history and search
