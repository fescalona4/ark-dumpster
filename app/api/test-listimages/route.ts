import { NextRequest, NextResponse } from 'next/server';
import { listImages } from '@/lib/supabase-storage';

export async function GET() {
  console.log('🔍 Testing listImages() function...\n');

  const folders = ['dump', 'junk', 'tree', 'carousel'];
  const results: any = {};

  for (const folder of folders) {
    console.log(`📁 Testing folder: "${folder}"`);
    console.log('='.repeat(40));

    try {
      const { data: files, error } = await listImages(folder);

      if (error) {
        console.error(`❌ Error fetching from ${folder}:`, error);
        results[folder] = { error: error.message, files: [] };
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`📭 No files found in ${folder} folder`);
        results[folder] = { files: [], imageCount: 0 };
        continue;
      }

      console.log(`✅ Found ${files.length} files in ${folder}:`);
      files.forEach((file: any, index: number) => {
        console.log(`  ${index + 1}. ${file.name} (created: ${file.created_at})`);
      });

      // Filter for image files
      const imageFiles = files.filter((file: any) =>
        file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      console.log(`🖼️  Image files: ${imageFiles.length}`);
      if (imageFiles.length > 0) {
        imageFiles.forEach((file: any, index: number) => {
          console.log(`     ${index + 1}. ${file.name}`);
        });
      }

      results[folder] = {
        totalFiles: files.length,
        imageFiles: imageFiles.map((f: any) => f.name),
        imageCount: imageFiles.length,
        allFiles: files.map((f: any) => ({ name: f.name, created_at: f.created_at }))
      };

    } catch (err: any) {
      console.error(`💥 Exception in ${folder}:`, err.message);
      results[folder] = { error: err.message, files: [] };
    }

    console.log('');
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  }, { status: 200 });
}
