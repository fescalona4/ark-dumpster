#!/usr/bin/env node

/**
 * Database Migration Script
 * Creates the update_dumpster_gps function
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please ensure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Creating update_dumpster_gps function...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/create-update-dumpster-gps-function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    
    // Execute the SQL directly using the raw SQL query approach
    const { data, error } = await supabase.rpc('exec', { 
      sql: migrationSQL 
    });
    
    if (error) {
      // If RPC doesn't work, we need to inform user to run it manually
      throw error;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Created function: update_dumpster_gps(uuid, double precision, double precision)');
    console.log('🔗 Function can now be called from the application to update dumpster GPS coordinates');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run the migration manually in your Supabase SQL editor:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Open SQL Editor');
    console.log('   4. Copy and paste the content of: supabase/create-update-dumpster-gps-function.sql');
    console.log('   5. Click "Run"');
    console.log('\n📄 Migration file contents:');
    console.log('─'.repeat(50));
    
    // Show the SQL contents for manual execution
    try {
      const migrationPath = path.join(__dirname, '../supabase/create-update-dumpster-gps-function.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(migrationSQL);
      console.log('─'.repeat(50));
    } catch (readError) {
      console.log('Could not read migration file:', readError.message);
    }
    
    process.exit(1);
  }
}

runMigration();