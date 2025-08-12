import { getImageUrl, listImages } from '@/lib/supabase-storage';
import Image from 'next/image';
import { FadeInAnimation, MoveSidewayAnimation } from './animated-components';

interface CarouselImage {
  name: string;
  url: string;
}

async function getCarouselImages(): Promise<CarouselImage[]> {
  try {
    console.log('Fetching images dynamically from carousel folder...');

    // Fetch images from the carousel folder
    const { data: files, error } = await listImages('carousel');

    if (error) {
      console.warn('Error fetching carousel images:', error);
      return [];
    }

    if (files && files.length > 0) {
      // Filter for image files and create URLs
      const imageFiles = files.filter(file =>
        file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      if (imageFiles.length === 0) {
        console.warn('No image files found in carousel folder');
        return [];
      }

      console.log(`Found ${imageFiles.length} images in carousel folder`);

      // Create carousel images with duplicates for seamless scrolling
      const baseImages = imageFiles.map(file => ({
        name: file.name,
        url: getImageUrl(`carousel/${file.name}`)
      }));

      // Duplicate images for seamless infinite scroll
      return [...baseImages, ...baseImages];
    } else {
      console.warn('No files found in carousel folder');
      return [];
    }
  } catch (err) {
    console.error('Error in getCarouselImages:', err);
    return [];
  }
}

interface CarouselProps {
  className?: string;
}

export default async function Carousel({ className }: CarouselProps) {
  const images = await getCarouselImages();

  // If no images are available, don't render the carousel
  if (images.length === 0) {
    console.log('No carousel images available, skipping carousel render');
    return null;
  }

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
