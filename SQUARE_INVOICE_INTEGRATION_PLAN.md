# Square API Invoice Integration Plan

## Overview
This document outlines the plan for integrating Square API's invoice functionality into the ARK Dumpster rental system. This integration will enable automatic invoice generation, payment processing, and tracking through Square's platform.

## Current State Analysis

### Existing Invoice System
- **Components**: 
  - `/components/invoices/invoice.tsx` - Main invoice display component
  - `/components/dialogs/invoice-dialog.tsx` - Modal for viewing invoices
  - `/components/invoices/invoice-summary.tsx` - Compact invoice summary
- **API**: `/api/orders/[orderId]/invoice/route.ts` - Current invoice generation endpoint
- **Features**: Local invoice generation, print functionality, basic tax calculation (8%)

## Implementation Steps

### Phase 1: Setup and Configuration

#### 1.1 Install Square SDK
```bash
npm install square
npm install --save-dev @types/square
```

#### 1.2 Environment Configuration
Add to `.env.local`:
```
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=sandbox # or production
SQUARE_APPLICATION_ID=your_app_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_key
```

### Phase 2: Core Integration

#### 2.1 Create Square Service Layer
**File**: `/lib/square-service.ts`

Core functions to implement:
- `initializeSquareClient()` - Initialize Square API client
- `createInvoice(order: Order)` - Convert order to Square invoice
- `sendInvoice(invoiceId: string)` - Send invoice to customer
- `getInvoiceStatus(invoiceId: string)` - Check payment status
- `updateInvoice(invoiceId: string, updates: any)` - Update invoice details
- `cancelInvoice(invoiceId: string)` - Cancel an invoice
- `listInvoices(filters?: any)` - List all invoices

#### 2.2 Extend Type Definitions
**File**: `/types/invoice.ts`
```typescript
export interface SquareInvoice {
  id: string;
  square_invoice_id: string;
  order_id: string;
  invoice_number: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELED';
  payment_requests: SquarePaymentRequest[];
  invoice_url?: string;
  public_url?: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
}

export interface SquarePaymentRequest {
  id: string;
  request_method: 'EMAIL' | 'SMS' | 'AUTOMATIC';
  request_type: 'BALANCE' | 'DEPOSIT' | 'INSTALLMENT';
  due_date?: string;
  percentage_requested?: number;
  fixed_amount_requested?: number;
}
```

### Phase 3: API Routes Development

#### 3.1 Square Invoice Creation
**File**: `/app/api/orders/[orderId]/square-invoice/route.ts`
- POST: Create Square invoice from order
- GET: Retrieve Square invoice details
- PUT: Update Square invoice
- DELETE: Cancel Square invoice

#### 3.2 Invoice Sending
**File**: `/app/api/orders/[orderId]/square-invoice/send/route.ts`
- POST: Send invoice via Square (email/SMS)

#### 3.3 Webhook Handler
**File**: `/app/api/webhooks/square/route.ts`
Handle Square webhook events:
- `invoice.payment_made`
- `invoice.sent`
- `invoice.updated`
- `invoice.deleted`
- `invoice.scheduled_charge_failed`

### Phase 4: Database Schema Updates

#### 4.1 Migration Script
**File**: `/supabase/square-invoice-migration.sql`
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_invoice_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_viewed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR(255);

CREATE INDEX idx_orders_square_invoice_id ON orders(square_invoice_id);
CREATE INDEX idx_orders_square_payment_status ON orders(square_payment_status);
```

### Phase 5: UI Components Update

#### 5.1 Enhanced Invoice Component
**Updates to**: `/components/invoices/invoice.tsx`
- Add Square payment button/link
- Show payment status indicator
- Display Square invoice ID

#### 5.2 Admin Invoice Management
**New Component**: `/components/admin/square-invoice-manager.tsx`
- Create Square invoice button
- Send invoice functionality
- Payment status tracking
- Refund management

#### 5.3 Invoice Dialog Updates
**Updates to**: `/components/dialogs/invoice-dialog.tsx`
- Add "Send via Square" button
- Show Square invoice status
- Display payment history

### Phase 6: Admin Dashboard Integration

#### 6.1 Orders Page Enhancement
**Updates to**: `/app/admin/orders/page.tsx`
- Add Square invoice status column
- Bulk invoice creation action
- Payment status filters

#### 6.2 Invoice Management Page
**New Page**: `/app/admin/invoices/square/page.tsx`
- List all Square invoices
- Filter by payment status
- Bulk actions (send, cancel)
- Payment reconciliation tools

### Phase 7: Customer Features

#### 7.1 Customer Invoice Portal
**New Page**: `/app/invoice/[invoiceId]/page.tsx`
- Public invoice view
- Secure payment form
- Payment history
- Download/print options

#### 7.2 Email Templates
**New Components**: `/components/email/square-invoice-email.tsx`
- Invoice notification template
- Payment confirmation template
- Payment reminder template

## Square API Integration Details

### Key Square Invoice API Endpoints
- `POST /v2/invoices` - Create invoice
- `PUT /v2/invoices/{invoice_id}` - Update invoice
- `POST /v2/invoices/{invoice_id}/send` - Send invoice
- `GET /v2/invoices/{invoice_id}` - Get invoice
- `DELETE /v2/invoices/{invoice_id}` - Delete invoice
- `POST /v2/invoices/search` - Search invoices

### Invoice Object Structure
```typescript
{
  invoice: {
    location_id: string;
    delivery_method: 'EMAIL' | 'SMS';
    payment_requests: Array<{
      request_method: 'EMAIL' | 'SMS';
      request_type: 'BALANCE' | 'DEPOSIT';
    }>;
    invoice_number: string;
    title: string;
    description: string;
    scheduled_at: string;
    acceptance_language: string;
    payment_conditions: string;
    sale_or_service_date: string;
    payment_requests: PaymentRequest[];
    primary_recipient: {
      customer_id: string;
    };
    invoice_line_items: Array<{
      quantity: string;
      base_price_money: {
        amount: number;
        currency: 'USD';
      };
      name: string;
      variation_name?: string;
      taxes?: Array<{
        name: string;
        percentage: string;
      }>;
    }>;
  }
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Install Square SDK
- [ ] Set up environment variables
- [ ] Create Square service layer
- [ ] Implement basic invoice creation

### Week 2: API Development
- [ ] Build API routes
- [ ] Implement webhook handlers
- [ ] Add database migrations
- [ ] Test invoice creation/sending

### Week 3: UI Integration
- [ ] Update invoice components
- [ ] Add Square payment buttons
- [ ] Create admin management interface
- [ ] Implement status tracking

### Week 4: Testing & Deployment
- [ ] Complete integration testing
- [ ] Test payment flows
- [ ] Deploy to staging
- [ ] Production deployment

## Testing Strategy

### Unit Tests
- Square service functions
- API route handlers
- Data transformation utilities

### Integration Tests
- End-to-end invoice creation
- Payment processing flow
- Webhook handling

### Manual Testing Checklist
- [ ] Create invoice from order
- [ ] Send invoice via email
- [ ] Process payment
- [ ] Handle partial payments
- [ ] Cancel/refund invoice
- [ ] Webhook event processing

## Security Considerations

1. **API Key Management**
   - Store credentials in environment variables
   - Never commit keys to repository
   - Use separate keys for sandbox/production

2. **Webhook Validation**
   - Verify webhook signatures
   - Validate event authenticity
   - Implement idempotency

3. **Payment Security**
   - Use Square's hosted payment pages
   - Never store card details
   - Implement PCI compliance

## Error Handling

### Common Error Scenarios
- Invalid customer email
- Duplicate invoice creation
- Failed payment processing
- Webhook delivery failures
- API rate limiting

### Error Response Strategy
- Log all Square API errors
- Implement retry logic for transient failures
- User-friendly error messages
- Admin notifications for critical failures

## Monitoring & Analytics

### Key Metrics to Track
- Invoice creation rate
- Payment success rate
- Average time to payment
- Failed payment attempts
- API response times

### Logging Strategy
- Log all Square API calls
- Track webhook events
- Monitor error rates
- Performance metrics

## Documentation Updates

### Files to Update
- `/docs/INVOICE_SYSTEM.md` - Add Square integration details
- `/README.md` - Add Square setup instructions
- API documentation for new endpoints

### New Documentation
- Square integration guide
- Payment processing flow
- Troubleshooting guide

## Future Enhancements

### Phase 2 Features
- Recurring invoices for subscriptions
- Multi-currency support
- Custom payment terms
- Advanced tax calculations
- Invoice templates

### Phase 3 Features
- Customer portal with payment history
- Automated payment reminders
- Bulk invoice operations
- Financial reporting integration
- QuickBooks sync

## Resources

### Square Documentation
- [Square Invoices API](https://developer.squareup.com/docs/invoices-api/overview)
- [Square Node.js SDK](https://github.com/square/square-nodejs-sdk)
- [Square Webhooks](https://developer.squareup.com/docs/webhooks/overview)
- [Square Sandbox Testing](https://developer.squareup.com/docs/testing/sandbox)

### Internal Documentation
- Current invoice system: `/docs/INVOICE_SYSTEM.md`
- Order types: `/types/order.ts`
- Database schema: `/types/database.ts`

## Notes

- Square charges transaction fees (typically 2.9% + 30¢ per invoice payment)
- Sandbox environment available for testing
- Rate limits: 500 requests per second
- Webhook retry policy: Square retries failed webhooks for up to 72 hours

## Questions to Address

1. Should we migrate existing invoices to Square?
2. Do we need custom invoice numbering or use Square's?
3. What payment methods should we accept?
4. How to handle partial payments?
5. Integration with existing accounting system?

---

*Last updated: January 2025*