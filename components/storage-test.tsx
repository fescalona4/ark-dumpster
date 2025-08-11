"use client";

import { useState } from 'react';
import { listImages, getImageUrl } from '@/lib/supabase-storage';

export default function StorageTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBucketConnection = async () => {
    setLoading(true);
    setTestResult('Testing bucket connection...\n');
    
    try {
      // Test 1: List root folder
      console.log('🧪 Testing root folder...');
      const rootResult = await listImages('');
      setTestResult(prev => prev + `Root folder: ${rootResult.data?.length || 0} items\n`);
      
      // Test 2: List carousel folder
      console.log('🧪 Testing carousel folder...');
      const carouselResult = await listImages('carousel');
      setTestResult(prev => prev + `Carousel folder: ${carouselResult.data?.length || 0} items\n`);
      
      // Test 3: Check if we can generate URLs
      console.log('🧪 Testing URL generation...');
      const testUrl = getImageUrl('carousel/dump5.jpg');
      setTestResult(prev => prev + `Test URL for carousel/dump5.jpg: ${testUrl}\n`);
      
      if (carouselResult.data && carouselResult.data.length > 0) {
        const firstFile = carouselResult.data[0];
        const url = getImageUrl(`carousel/${firstFile.name}`);
        setTestResult(prev => prev + `First image URL: ${url}\n`);
      }
      
      // Test 4: Environment variables
      setTestResult(prev => prev + `Supabase URL exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
      setTestResult(prev => prev + `Supabase Key exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\n`);
      
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(prev => prev + `Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Supabase Storage Test</h3>
      <button 
        onClick={testBucketConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Testing...
          </div>
        ) : (
          'Test Bucket Connection'
        )}
      </button>
      
      {testResult && (
        <pre className="mt-4 p-3 bg-white border rounded text-sm whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </div>
  );
}
