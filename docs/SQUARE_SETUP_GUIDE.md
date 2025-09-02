# Square Invoice Integration Setup Guide

This guide walks you through setting up Square invoice integration for your ARK Dumpster application.

## Prerequisites

1. **Square Developer Account**: Create a free account at [developer.squareup.com](https://developer.squareup.com)
2. **Square Application**: Create a new application in your Square developer dashboard
3. **Supabase Database Access**: Ensure you have admin access to your Supabase project

## Step 1: Square Application Setup

### 1.1 Create Square Application

1. Log in to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Click "Create App"
3. Choose "Custom App"
4. Name your app (e.g., "ARK Dumpster Invoices")
5. Select your business location

### 1.2 Get API Credentials

From your Square application dashboard, collect:

- **Application ID**: Found in "Credentials" tab
- **Access Token**:
  - Sandbox: Use sandbox access token for testing
  - Production: Use production access token for live payments
- **Location ID**: Found in "Locations" tab
- **Webhook Signature Key**: Generate in "Webhooks" tab

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Add the following to your `.env.local` file:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=your_square_application_id_here
SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_signature_key_here
```

### 2.2 Environment Selection

- **Development/Testing**: Use `SQUARE_ENVIRONMENT=sandbox`
- **Production**: Use `SQUARE_ENVIRONMENT=production`

## Step 3: Database Migration

### 3.1 Run Migration Script

Execute the migration to add Square-related columns:

```bash
node scripts/run-square-migration.js
```

### 3.2 Manual Migration (Alternative)

If the script doesn't work, run the SQL directly in Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/square-invoice-migration.sql
```

### 3.3 Verify Migration

Check that these columns were added to the `orders` table:

- `square_invoice_id`
- `square_customer_id`
- `square_payment_status`
- `payment_link`
- `invoice_sent_at`
- `invoice_viewed_at`
- `invoice_paid_at`
- `square_invoice_amount`
- `square_paid_amount`

## Step 4: Webhook Configuration

### 4.1 Set Up Webhook Endpoint

In Square Developer Dashboard → Webhooks:

1. Click "Add Endpoint"
2. Set URL: `https://your-domain.com/api/webhooks/square`
3. Select events:
   - `invoice.created`
   - `invoice.sent`
   - `invoice.payment_made`
   - `invoice.updated`
   - `invoice.canceled`
   - `invoice.deleted`
   - `invoice.scheduled_charge_failed`
4. Save the webhook

### 4.2 Test Webhook (Optional)

Use a tool like ngrok for local testing:

```bash
ngrok http 3000
```

Then use the ngrok URL for your webhook endpoint.

## Step 5: Testing

### 5.1 Test Invoice Creation

1. Go to Admin → Orders
2. Select an order
3. Click "Create Square Invoice"
4. Fill in the details and create
5. Verify invoice appears in Square Dashboard

### 5.2 Test Invoice Sending

1. Click "Send Invoice" on a created invoice
2. Check that customer receives email
3. Verify webhook events are logged

### 5.3 Test Payment Flow

1. Use Square's test card numbers in sandbox
2. Make a test payment
3. Verify webhook updates payment status
4. Check payment reflects in admin panel

## Step 6: Production Deployment

### 6.1 Switch to Production

1. Update `SQUARE_ENVIRONMENT=production`
2. Replace sandbox credentials with production ones
3. Update webhook URL to production domain
4. Test with small real transaction

### 6.2 Go Live Checklist

- [ ] Production Square app approved
- [ ] Production webhook endpoint configured
- [ ] All environment variables updated
- [ ] Test transaction successful
- [ ] Webhook events processing correctly
- [ ] Customer email notifications working

## Troubleshooting

### Common Issues

#### 1. "Access token invalid"

- Verify token is correct and active
- Check environment (sandbox vs production) matches token type
- Ensure location ID matches the token's business

#### 2. "Location not found"

- Confirm location ID is correct
- Verify location is active in Square dashboard

#### 3. "Webhook signature invalid"

- Check webhook signature key matches exactly
- Ensure no extra spaces or characters

#### 4. Database migration failed

- Run migration SQL manually in Supabase
- Check service role key has sufficient permissions
- Verify table structure in database

#### 5. Invoice creation fails

- Check all required fields are provided
- Verify customer email is valid
- Ensure order amount is greater than $0

### Debug Tools

#### 1. Check Webhook Logs

In Square Dashboard → Webhooks → View logs to see delivery status

#### 2. API Response Logging

Check your application logs for Square API responses

#### 3. Database Verification

Query `webhook_events` table to see received webhooks:

```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;
```

## Security Best Practices

### 1. Environment Variables

- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly

### 2. Webhook Security

- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement proper error handling

### 3. PCI Compliance

- Never store credit card information
- Use Square's hosted payment pages
- Follow PCI DSS guidelines

## Support Resources

- [Square API Documentation](https://developer.squareup.com/docs)
- [Square Invoices API Reference](https://developer.squareup.com/reference/square/invoices-api)
- [Square Webhook Guide](https://developer.squareup.com/docs/webhooks/overview)
- [Square Testing Guide](https://developer.squareup.com/docs/testing/sandbox)

## Feature Roadmap

### Phase 2 Features

- [ ] Recurring invoices
- [ ] Payment reminders
- [ ] Partial payments
- [ ] Refund processing
- [ ] Custom tax rates

### Phase 3 Features

- [ ] Multi-currency support
- [ ] Payment analytics
- [ ] Customer payment portal
- [ ] Automated reporting
- [ ] Integration with accounting systems

---

For additional support, refer to the main documentation or create an issue in the project repository.
