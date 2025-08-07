#!/usr/bin/env node

// Quick test script to verify Supabase connection
// Run with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please check your .env.local file and ensure all Supabase variables are set.');
  process.exit(1);
}

// Test connection
try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('\n🔗 Testing connection...');
  
  // Test basic connection by trying to access the contacts table
  const { data, error, count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if your Supabase project is active');
    console.log('2. Verify your URL and API key are correct');
    console.log('3. Make sure you\'ve run the database migration');
    console.log('4. Check if the contacts table exists');
    process.exit(1);
  } else {
    console.log('✅ Successfully connected to Supabase!');
    console.log(`📊 Found ${count} contact(s) in the database`);
    
    // Test insert capability
    console.log('\n🧪 Testing insert permissions...');
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert([
        {
          name: 'Test Contact',
          email: 'test@example.com',
          phone: '',
          message: 'This is a test message from the connection script'
        }
      ])
      .select();
    
    if (insertError) {
      console.log('⚠️  Insert test failed:', insertError.message);
      console.log('This might be due to RLS policies or missing table.');
    } else {
      console.log('✅ Insert test successful!');
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('contacts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Cleaned up test data');
      }
    }
    
    console.log('\n🎉 Supabase setup is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit http://localhost:3000/contact to test the form');
    console.log('3. Visit http://localhost:3000/admin to view submissions');
  }
  
} catch (error) {
  console.log('❌ Unexpected error:', error.message);
  process.exit(1);
}
