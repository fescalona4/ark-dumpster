import { supabase } from './supabase';

// Hardcoded bucket name
const BUCKET_NAME = 'ark-bucket';

/**
 * Get public URL for an image from Supabase storage
 * @param imagePath - Path to the image in the bucket
 * @returns Public URL string
 */
export function getImageUrl(imagePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  return data.publicUrl;
}

/**
 * Get signed URL for private bucket access (expires in 1 hour by default)
 * @param imagePath - Path to the image in the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL
 */
export async function getSignedImageUrl(imagePath: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
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
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
    limit: 100,
    offset: 0,
  });

  if (error) {
    console.error('Error listing images:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Download an image as a blob
 * @param imagePath - Path to the image in the bucket
 * @returns Promise with image blob
 */
export async function downloadImage(imagePath: string) {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(imagePath);

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
