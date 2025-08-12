/**
 * Custom image loader for Next.js Image component
 * This handles image optimization for static exports
 */

interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({
  src,
  width,
  quality,
}: LoaderParams): string {
  // For Supabase images, try to use their transformation API
  if (src.includes('supabase.co')) {
    const url = new URL(src);
    url.searchParams.set('width', width.toString());
    if (quality) {
      url.searchParams.set('quality', quality.toString());
    }
    // Add WebP format for better compression
    url.searchParams.set('format', 'webp');
    return url.toString();
  }

  // For other images (like Framer), return as-is or use a service like Cloudinary
  // Example with Cloudinary (uncomment and configure if you have an account):
  // if (src.startsWith('https://')) {
  //   return `https://res.cloudinary.com/your-cloud-name/image/fetch/f_auto,c_limit,w_${width},q_${quality || 75}/${encodeURIComponent(src)}`;
  // }

  // Fallback: return original URL
  return src;
}
