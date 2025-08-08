import { listImages, getImageUrl } from '@/lib/supabase-storage';
import CarouselClient from './carousel-client';

interface CarouselImage {
    name: string;
    url: string;
}

async function getCarouselImages(): Promise<CarouselImage[]> {
    // Return fallback images immediately for server-side rendering
    // This avoids network issues during build/SSR
    try {
        // Only attempt to fetch if we're in a development environment
        // or if specifically configured for server-side storage access
        console.log('Using fallback images for server component...');
        return getFallbackImages();
        
        // Note: The actual Supabase fetch is commented out to prevent SSR errors
        // If you need dynamic images, consider using a client component instead
        
        /*
        console.log('Loading images from carousel folder...');
        
        // Load images from the 'carousel' folder
        const { data, error } = await listImages('carousel');
        
        if (error) {
            console.error('Error accessing carousel folder:', error);
            return getFallbackImages();
        }
        
        if (data && data.length > 0) {
            console.log('✅ Found files in carousel folder:', data);
            
            // Filter only image files and map to our format
            const imageFiles = data
                .filter((file: any) => {
                    const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    console.log(`📄 File: ${file.name}, isImage: ${!!isImage}`);
                    return isImage;
                })
                .slice(0, 8) // Limit to 8 images for performance
                .map((file: any) => {
                    const url = getImageUrl(`carousel/${file.name}`);
                    console.log(`🖼️ Generated URL for ${file.name}: ${url}`);
                    return {
                        name: file.name,
                        url: url
                    };
                });
            
            console.log('🖼️ Processed image files:', imageFiles);
            
            if (imageFiles.length > 0) {
                // Duplicate images for seamless scrolling
                return [...imageFiles, ...imageFiles];
            }
        } else {
            console.warn('📁 Carousel folder appears empty');
        }
        */
        
    } catch (err) {
        console.error('Error in getCarouselImages:', err);
        return getFallbackImages();
    }
}

function getFallbackImages(): CarouselImage[] {
    // Use static/known image URLs that don't require server-side Supabase calls
    // These can be actual Supabase URLs if you know the specific image names
    try {
        return [
            { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
            { name: 'dump2.jpg', url: getImageUrl('carousel/dump2.jpg') },
            { name: 'dump3.jpg', url: getImageUrl('carousel/dump3.jpg') },
            { name: 'dump4.jpg', url: getImageUrl('carousel/dump4.jpg') },
            // Duplicate for seamless scrolling
            { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
            { name: 'dump2.jpg', url: getImageUrl('carousel/dump2.jpg') },
            { name: 'dump3.jpg', url: getImageUrl('carousel/dump3.jpg') },
            { name: 'dump4.jpg', url: getImageUrl('carousel/dump4.jpg') },
        ];
    } catch (error) {
        // If getImageUrl also fails, use local fallback images
        console.warn('Falling back to local images due to URL generation error:', error);
        return [
            { name: 'fallback1.jpg', url: '/next.svg' },
            { name: 'fallback2.jpg', url: '/vercel.svg' },
            { name: 'fallback1.jpg', url: '/next.svg' },
            { name: 'fallback2.jpg', url: '/vercel.svg' },
        ];
    }
}

interface CarouselProps {
    className?: string;
}

export default async function Carousel({ className }: CarouselProps) {
    const images = await getCarouselImages();
    
    return <CarouselClient images={images} className={className} />;
}
