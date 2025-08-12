import { getImageUrl, listImages } from '@/lib/supabase-storage';
import Image from 'next/image';
import { FadeInAnimation, MoveSidewayAnimation } from './animated-components';

interface CarouselImage {
  name: string;
  url: string;
}

async function getCarouselImages(): Promise<CarouselImage[]> {
  try {
    console.log('Fetching images dynamically from dump folder for carousel...');

    // Fetch images from the dump folder
    const { data: files, error } = await listImages('dump');

    if (error) {
      console.warn('Error fetching carousel images:', error);
      return getFallbackImages();
    }

    if (files && files.length > 0) {
      // Filter for image files and create URLs
      const imageFiles = files.filter(file =>
        file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      if (imageFiles.length === 0) {
        console.warn('No image files found in dump folder');
        return getFallbackImages();
      }

      console.log(`Found ${imageFiles.length} images in dump folder for carousel`);

      // Create carousel images with duplicates for seamless scrolling
      const baseImages = imageFiles.map(file => ({
        name: file.name,
        url: getImageUrl(`dump/${file.name}`)
      }));

      // Duplicate images for seamless infinite scroll
      return [...baseImages, ...baseImages];
    } else {
      console.warn('No files found in carousel folder');
      return getFallbackImages();
    }
  } catch (err) {
    console.error('Error in getCarouselImages:', err);
    return getFallbackImages();
  }
}

function getFallbackImages(): CarouselImage[] {
  // Fallback to hardcoded images if dynamic fetching fails
  console.log('Using fallback images for carousel...');
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
    console.warn('Falling back to empty carousel due to URL generation error:', error);
    return [];
  }
}

interface CarouselProps {
  className?: string;
}

export default async function Carousel({ className }: CarouselProps) {
  const images = await getCarouselImages();

  return (
    <FadeInAnimation>
      <div
        className={className}
        style={{
          alignContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: '40px',
          height: '400px',
          justifyContent: 'center',
          overflow: 'visible',
          padding: 0,
          position: 'relative',
        }}
      >
        <section
          style={{
            display: 'flex',
            placeItems: 'center',
            margin: '0px',
            padding: '0px',
            listStyleType: 'none',
            opacity: 1,
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}
        >
          <MoveSidewayAnimation>
            {images.map((image, index) => (
              <li key={`${image.name}-${index}`} style={{ width: '400px', height: '300px' }}>
                <div
                  className="framer-1cosb6b-container"
                  data-framer-name="Ticker Image"
                  style={{ width: '400px', height: '100%', flexShrink: 0 }}
                >
                  <div
                    className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0"
                    data-framer-name="Variant 1"
                    style={{
                      backgroundColor: 'rgb(255, 255, 255)',
                      height: '100%',
                      width: '100%',
                      opacity: 1,
                    }}
                  >
                    <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                      <Image
                        src={image.url}
                        alt={`Carousel Image ${index + 1}`}
                        width={400}
                        height={300}
                        sizes="400px"
                        priority={index < 4} // Prioritize first 4 images for better performance
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          borderRadius: 'inherit',
                          objectPosition: 'center',
                          objectFit: 'cover',
                        }}
                      // unoptimized
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </MoveSidewayAnimation>
        </section>
      </div>
    </FadeInAnimation>
  );
}
