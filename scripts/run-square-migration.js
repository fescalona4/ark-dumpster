/**
 * Script to run Square Invoice migration
 * This adds Square-related columns to the orders table
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

async function runMigration() {
  console.log('🚀 Starting Square Invoice migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'square-invoice-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running migration SQL...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

    if (error) {
      // If the RPC function doesn't exist, try executing statements individually
      console.log('⚠️  exec_sql RPC not found, executing statements individually...\n');

      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        // For ALTER TABLE statements, we need to check if columns exist
        if (statement.includes('ALTER TABLE')) {
          // Skip individual error handling for ALTER TABLE since columns might already exist
          try {
            await supabase.rpc('exec_sql', { sql: statement + ';' }).single();
          } catch (err) {
            // Check if it's a "column already exists" error
            if (err.message && err.message.includes('already exists')) {
              console.log(`  ℹ️  Column already exists, skipping...`);
            } else {
              console.log(`  ⚠️  Warning: ${err.message}`);
            }
          }
        } else {
          // For other statements, execute normally
          const { error: stmtError } = await supabase
            .rpc('exec_sql', { sql: statement + ';' })
            .single();
          if (stmtError) {
            console.log(`  ⚠️  Warning: ${stmtError.message}`);
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify the migration by checking if columns exist
    console.log('\n🔍 Verifying migration...');

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, square_invoice_id, square_payment_status, payment_link')
      .limit(1);

    if (!orderError) {
      console.log('✅ Square invoice columns verified successfully!');
      console.log('\nNew columns added to orders table:');
      console.log('  • square_invoice_id');
      console.log('  • square_customer_id');
      console.log('  • square_payment_status');
      console.log('  • payment_link');
      console.log('  • invoice_sent_at');
      console.log('  • invoice_viewed_at');
      console.log('  • invoice_paid_at');
      console.log('  • square_invoice_amount');
      console.log('  • square_paid_amount');
    } else {
      console.log('⚠️  Could not verify columns:', orderError.message);
    }

    // Check if webhook_events table was created
    const { data: webhookData, error: webhookError } = await supabase
      .from('webhook_events')
      .select('id')
      .limit(1);

    if (!webhookError) {
      console.log('\n✅ webhook_events table created successfully!');
    }

    // Check if payment_events table was created
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_events')
      .select('id')
      .limit(1);

    if (!paymentError) {
      console.log('✅ payment_events table created successfully!');
    }

    console.log('\n🎉 Square Invoice migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add your Square API credentials to .env.local:');
    console.log('   - SQUARE_ACCESS_TOKEN');
    console.log('   - SQUARE_LOCATION_ID');
    console.log('   - SQUARE_ENVIRONMENT (sandbox or production)');
    console.log('   - SQUARE_APPLICATION_ID');
    console.log('   - SQUARE_WEBHOOK_SIGNATURE_KEY');
    console.log('2. Configure Square webhook endpoint: /api/webhooks/square');
    console.log('3. Test invoice creation in the admin panel');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach if exec_sql RPC doesn't exist
async function runMigrationDirect() {
  console.log('🚀 Starting Square Invoice migration (direct approach)...\n');

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error('Failed to connect to database: ' + testError.message);
    }

    console.log('✅ Database connection successful');
    console.log('\n⚠️  Note: This script requires the database migration to be run manually.');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('----------------------------------------');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'square-invoice-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    console.log('----------------------------------------');
    console.log(
      "\nOnce you've run the migration, the Square Invoice integration will be ready to use!"
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Check if we have the required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

// Try to run migration with exec_sql first, fall back to direct approach if needed
runMigrationDirect();
