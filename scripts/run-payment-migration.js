/**
 * Script to run Payment System Migration
 * This creates the comprehensive payment and invoice tracking system
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runPaymentMigration() {
  console.log('🚀 Starting Payment System migration...\n');

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error('Failed to connect to database: ' + testError.message);
    }

    console.log('✅ Database connection successful\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'payment-system-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running Payment System migration SQL...\n');
    console.log('⚠️  Note: This migration will create comprehensive payment tracking tables.');
    console.log('📄 Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    console.log('\n📋 Migration SQL Overview:');
    console.log('  • Creates payment_status, payment_method, payment_type enums');
    console.log('  • Creates payments table with comprehensive tracking');
    console.log('  • Creates payment_transactions table for transaction history');
    console.log('  • Creates payment_reminders table for reminder scheduling');
    console.log('  • Creates payment_line_items table for detailed invoicing');
    console.log('  • Creates payment_webhook_events table for webhook logging');
    console.log('  • Creates indexes for optimal query performance');
    console.log('  • Creates triggers for automatic calculations and updates');
    console.log('  • Creates views for common payment queries');

    console.log('\n🎯 Key Features:');
    console.log('  ✅ Comprehensive payment and invoice tracking');
    console.log('  ✅ Square API integration support');
    console.log('  ✅ Multi-payment method support');
    console.log('  ✅ Automatic payment calculations');
    console.log('  ✅ Transaction history tracking');
    console.log('  ✅ Webhook event logging');
    console.log('  ✅ Payment reminder system');
    console.log('  ✅ Detailed line item support');

    console.log('\n📊 New Tables Created:');
    console.log('  • payments - Main payment records');
    console.log('  • payment_transactions - Transaction history');
    console.log('  • payment_reminders - Payment reminder scheduling');
    console.log('  • payment_line_items - Invoice line items');
    console.log('  • payment_webhook_events - Webhook event logging');

    console.log('\n📈 Views Created:');
    console.log('  • payment_summary - Optimized payment queries with order info');
    console.log('  • order_payment_status - Order-level payment status summary');

    console.log('\n🔧 Functions & Triggers:');
    console.log('  • Auto-generate payment numbers (PAY-000001, etc.)');
    console.log('  • Auto-calculate payment totals and taxes');
    console.log('  • Auto-update payment status based on amounts');
    console.log('  • Auto-update timestamps on changes');

    console.log('\n🚀 Next Steps After Running Migration:');
    console.log('1. Verify tables were created successfully');
    console.log('2. Test payment creation via API');
    console.log('3. Configure Square webhooks to use new system');
    console.log('4. Update UI components to use Payment data');
    console.log('5. Consider migrating existing invoice data to Payment system');

    console.log('\n⚠️  Migration Notes:');
    console.log('• This migration is additive and safe to run');
    console.log('• Existing order data will not be affected');
    console.log('• Old Square fields on orders table are preserved (commented out cleanup)');
    console.log('• Use the new Payment API endpoints for all invoice operations');

    console.log('\n🔄 To migrate existing Square invoice data:');
    console.log('• Run a data migration script to convert existing orders with');
    console.log('  square_invoice_id to Payment records');
    console.log('• This can be done incrementally without downtime');
  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    process.exit(1);
  }
}

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

runPaymentMigration();
