#!/usr/bin/env node

/**
 * Database Migration Script
 * Update dumpster status system to simplified 'available' and 'in_use' only
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runStatusMigration() {
  try {
    console.log('🔄 Starting dumpster status migration...');
    console.log('📝 Updating status system to: available, in_use');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/update-dumpster-status-migration.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('SELECT'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   ${i + 1}. ${statement.split('\n')[0].substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement 
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration results...');
    const { data: statusCheck, error: checkError } = await supabase
      .from('dumpsters')
      .select('status')
      .neq('status', null);
      
    if (checkError) {
      console.error('❌ Error verifying results:', checkError);
    } else {
      const statusCounts = statusCheck.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Current dumpster status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
    
    console.log('\n✅ Dumpster status migration completed successfully!');
    console.log('🎯 Changes made:');
    console.log('   - Converted "assigned" → "in_use"'); 
    console.log('   - Converted other statuses → "available"');
    console.log('   - Updated database constraint to only allow: available, in_use');
    console.log('   - All existing dumpsters now have valid status values');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Manual migration steps:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Navigate to your project → SQL Editor');
    console.log('   3. Copy and paste the content from:');
    console.log('      supabase/update-dumpster-status-migration.sql');
    console.log('   4. Click "Run" to execute the migration');
    process.exit(1);
  }
}

runStatusMigration();