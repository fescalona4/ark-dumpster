import { supabase } from './supabase';
import { createServerSupabaseClient } from './supabase-server';

// Hardcoded bucket name
const BUCKET_NAME = 'ark-bucket';

// Use server client with service role for admin operations (listing, etc.)
const serverSupabase = typeof window === 'undefined' ? createServerSupabaseClient() : null;

/**
 * Get public URL for an image from Supabase storage
 * @param imagePath - Path to the image in the bucket
 * @returns Public URL string
 */
export function getImageUrl(imagePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  // In development, use image proxy to bypass corporate firewall for Next.js image optimization
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return `/api/image-proxy?url=${encodeURIComponent(data.publicUrl)}`;
  }

  return data.publicUrl;
}

/**
 * Get signed URL for private bucket access (expires in 1 hour by default)
 * @param imagePath - Path to the image in the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL
 */
export async function getSignedImageUrl(imagePath: string, expiresIn: number = 3600) {
  // Use server client for signed URLs (requires elevated permissions)
  const client = serverSupabase || supabase;

  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return { data: null, error };
  }

  return { data: data.signedUrl, error: null };
}

/**
 * List all files in a storage bucket folder
 * @param folder - Folder path (optional, defaults to root)
 * @returns Promise with list of files
 */
export async function listImages(folder: string = '') {
  try {
    console.log(`📁 Listing images from folder: ${folder}`);

    // Use our custom proxy endpoint with service role key
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'  // Back to port 3000
      : `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/storage-list?folder=${encodeURIComponent(folder)}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error listing images via proxy:', errorData.error);
      return { data: [], error: new Error(errorData.error) };
    }

    const data = await response.json();
    console.log(`✅ Successfully listed ${data.length} files from folder "${folder}" via service role proxy`);

    return { data, error: null };
  } catch (error: any) {
    console.error('Error in listImages proxy call:', error);
    return { data: [], error };
  }
}/**
 * Download an image as a blob
 * @param imagePath - Path to the image in the bucket
 * @returns Promise with image blob
 */
export async function downloadImage(imagePath: string) {
  // Use server client for downloads (may require elevated permissions)
  const client = serverSupabase || supabase;

  const { data, error } = await client.storage.from(BUCKET_NAME).download(imagePath);

  if (error) {
    console.error('Error downloading image:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get optimized image URL with transformations
 * @param imagePath - Path to the image in the bucket
 * @param options - Transformation options (width, height, quality, etc.)
 * @returns Transformed image URL
 */
export function getOptimizedImageUrl(
  imagePath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const baseUrl = getImageUrl(imagePath);

  // If no transformations needed, return original URL
  if (Object.keys(options).length === 0) {
    return baseUrl;
  }

  // Build transformation URL (Note: This depends on your Supabase plan and configuration)
  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);

  return `${baseUrl}?${params.toString()}`;
}
