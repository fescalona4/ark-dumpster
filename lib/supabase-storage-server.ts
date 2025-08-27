import { createServerSupabaseClient } from './supabase-server';

// Server-side storage utilities that always use service role key
// Use these for admin operations that require elevated permissions

const BUCKET_NAME = 'ark-bucket';

// Always use service role client for server-side admin operations
const serverSupabase = createServerSupabaseClient();

/**
 * Server-side list all files in a storage bucket folder (uses service role key)
 * @param folder - Folder path (optional, defaults to root)
 * @returns Promise with list of files
 */
export async function listImagesWithServiceRole(folder: string = '') {
  try {
    console.log(`📁 [SERVICE-ROLE] Listing images from folder: ${folder}`);

    const { data, error } = await serverSupabase.storage.from(BUCKET_NAME).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error('Error listing images with service role:', error);
      return { data: null, error };
    }

    console.log(`✅ [SERVICE-ROLE] Found ${data.length} files in folder: ${folder}`);
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Error in listImagesWithServiceRole:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
}

/**
 * Server-side create signed URL (uses service role key)
 * @param imagePath - Path to the image in the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL
 */
export async function createSignedUrlWithServiceRole(imagePath: string, expiresIn: number = 3600) {
  try {
    console.log(`🔐 [SERVICE-ROLE] Creating signed URL for: ${imagePath}`);

    const { data, error } = await serverSupabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(imagePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL with service role:', error);
      return { data: null, error };
    }

    console.log(`✅ [SERVICE-ROLE] Created signed URL for: ${imagePath}`);
    return { data: data.signedUrl, error: null };
  } catch (error: unknown) {
    console.error('Error in createSignedUrlWithServiceRole:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
}

/**
 * Server-side upload file to storage (uses service role key)
 * @param filePath - Path where the file should be stored
 * @param file - File data to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadFileWithServiceRole(
  filePath: string,
  file: File | Blob | ArrayBuffer | string,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  try {
    console.log(`📤 [SERVICE-ROLE] Uploading file to: ${filePath}`);

    const { data, error } = await serverSupabase.storage.from(BUCKET_NAME).upload(filePath, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });

    if (error) {
      console.error('Error uploading file with service role:', error);
      return { data: null, error };
    }

    console.log(`✅ [SERVICE-ROLE] Uploaded file to: ${filePath}`);
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Error in uploadFileWithServiceRole:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
}

/**
 * Server-side delete file from storage (uses service role key)
 * @param filePaths - Array of file paths to delete
 * @returns Promise with delete result
 */
export async function deleteFilesWithServiceRole(filePaths: string[]) {
  try {
    console.log(`🗑️ [SERVICE-ROLE] Deleting files:`, filePaths);

    const { data, error } = await serverSupabase.storage.from(BUCKET_NAME).remove(filePaths);

    if (error) {
      console.error('Error deleting files with service role:', error);
      return { data: null, error };
    }

    console.log(`✅ [SERVICE-ROLE] Deleted ${data.length} files`);
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Error in deleteFilesWithServiceRole:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
}
