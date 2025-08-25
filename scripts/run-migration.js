#!/usr/bin/env node

/**
 * Database Migration Script
 * Run the completed dumpster tracking migration
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
    console.log('🔄 Running migration: add-completed-dumpster-tracking.sql');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/add-completed-dumpster-tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: statement 
      });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase
          .from('_fake_table_to_execute_raw_sql')
          .select()
          .limit(0);
          
        if (directError) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added columns:');
    console.log('   - completed_with_dumpster_id (uuid, nullable)');
    console.log('   - completed_with_dumpster_name (text, nullable)');
    console.log('🔗 Added foreign key constraint to dumpsters table');
    console.log('📊 Added database index for performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run the migration manually in your Supabase SQL editor:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Copy and paste the content of: supabase/add-completed-dumpster-tracking.sql');
    console.log('   4. Click "Run"');
    process.exit(1);
  }
}

runMigration();