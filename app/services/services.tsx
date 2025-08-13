'use client';

import { RiAddLine, RiDeleteBinLine, RiPlantLine, RiArchiveLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getImageUrl, listImages } from '@/lib/supabase-storage';

import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';

// Service folders to fetch images from
const serviceFolders = ['dump', 'tree', 'junk'] as const;

// Define service types
interface ServiceImages {
  dump: string[];
  junk: string[];
  tree: string[];
}

const items = [
  {
    id: '1',
    icon: RiArchiveLine,
    title: 'Dumpster Rental',
    folder: 'dump' as keyof ServiceImages,
    content:
      'We offer flexible dumpster rental options to suit your project needs. Our dumpsters come in various sizes, making it easy to find the perfect fit for your residential or commercial project. With prompt delivery and pickup, we ensure a hassle-free experience.',
  },
  {
    id: '2',
    icon: RiPlantLine,
    title: 'Tree Services',
    folder: 'tree' as keyof ServiceImages,
    content:
      'We provide expert tree services, including trimming, pruning, and removal. Our team is equipped to handle trees of all sizes, ensuring safety and efficiency. Whether you need routine maintenance or emergency tree removal, we have the expertise to manage your needs.',
  },
  {
    id: '3',
    icon: RiDeleteBinLine,
    title: 'Junk Removal',
    folder: 'junk' as keyof ServiceImages,
    content:
      'We offer comprehensive junk removal services for residential and commercial properties. Our team handles everything from furniture and appliances to yard waste and construction debris, ensuring your space is clutter-free and ready for use.',
  },
];

export default function ServiceSection() {
  const [activeItem, setActiveItem] = useState('1');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [serviceImages, setServiceImages] = useState<ServiceImages>({
    dump: [],
    junk: [],
    tree: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const newServiceImages: ServiceImages = {
          dump: [],
          junk: [],
          tree: []
        };

        // Fetch images dynamically from each folder
        for (const folder of serviceFolders) {
          try {
            const { data: files, error } = await listImages(folder);

            if (error) {
              console.warn(`Error fetching images from ${folder}:`, error);
              continue;
            }

            if (files && files.length > 0) {
              // Filter for image files and create URLs
              const imageFiles = files.filter((file: any) =>
                file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
              );

              newServiceImages[folder] = imageFiles.map((file: any) =>
                getImageUrl(`${folder}/${file.name}`)
              );

              console.log(`Found ${imageFiles.length} images in ${folder} folder`);
            } else {
              console.warn(`No images found in ${folder} folder`);
            }
          } catch (error) {
            console.warn(`Failed to fetch images from ${folder}:`, error);
          }
        }

        setServiceImages(newServiceImages);
        console.log('Final service images state:', newServiceImages);
      } catch (error) {
        console.error('Error setting up service images:', error);
        // Use empty arrays in case of complete failure
        setServiceImages({
          dump: [],
          junk: [],
          tree: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);  // Reset image index when switching services
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeItem]);

  const currentItem = items.find(item => item.id === activeItem) || items[0];
  const currentImages = serviceImages[currentItem.folder] || [];
  const currentImageUrl = currentImages[currentImageIndex] || '';

  const nextImage = () => {
    if (currentImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
    }
  };

  const prevImage = () => {
    if (currentImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    }
  };

  return (
    <motion.section
      id="services"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex flex-col items-center">
        <div className="max-w-screen-xl px-10 mt-36 flex justify-center">
          <div className="flex-1 mt-2 items-center text-center max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 text-sm px-2 py-0.5 border-black dark:border-border"
            >
              Services
            </Badge>
            <h1 className="text-5xl text-foreground mb-4 pt-2 flex items-center justify-center">
              What we do
            </h1>
            <h3 className="text-xl font-light">
              Find out which one of our services fits your project needs
            </h3>
          </div>
        </div>

        {/* Services Layout with Dynamic Image and Accordion */}
        <div className="max-w-screen-xl mx-6 md:mx-16 mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Dynamic Image */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="relative h-96 rounded-lg overflow-hidden shadow-lg"
                >
                  {loading ? (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                      <div className="text-gray-500 dark:text-gray-400">Loading images...</div>
                    </div>
                  ) : currentImageUrl ? (
                    <>
                      <Image
                        src={currentImageUrl}
                        alt={`${currentItem.title} service`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                        onError={(e) => {
                          console.error('Image failed to load:', currentImageUrl);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Image Navigation */}
                      {currentImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            aria-label="Previous image"
                          >
                            <RiArrowLeftSLine size={20} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            aria-label="Next image"
                          >
                            <RiArrowRightSLine size={20} />
                          </button>

                          {/* Image Indicators */}
                          <div className="absolute top-4 right-4 flex gap-1">
                            {currentImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                  ? 'bg-white'
                                  : 'bg-white/50 hover:bg-white/70'
                                  }`}
                                aria-label={`View image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                          <currentItem.icon size={28} className="text-white" />
                          <h3 className="text-2xl font-bold">{currentItem.title}</h3>
                        </div>
                        <p className="text-sm text-gray-200 max-w-md leading-relaxed">
                          {currentItem.content.slice(0, 100)}...
                        </p>
                        {currentImages.length > 1 && (
                          <div className="mt-3 text-xs text-gray-300">
                            {currentImageIndex + 1} of {currentImages.length} images
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <currentItem.icon size={48} className="mx-auto mb-4 text-gray-400" />
                        <div className="text-gray-500 dark:text-gray-400">{currentItem.title}</div>
                        <div className="text-sm text-gray-400 mt-2">No image available</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Side - Accordion */}
            <div className="space-y-4">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                value={activeItem}
                onValueChange={(value) => value && setActiveItem(value)}
              >
                {items.map(item => (
                  <AccordionItem value={item.id} key={item.id} className="py-2">
                    <AccordionPrimitive.Header className="flex">
                      <AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-sm text-[15px] leading-6 font-semibold transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0">
                        <span className="flex items-center gap-3">
                          <item.icon size={26} className="shrink-0 opacity-60" aria-hidden="true" />
                          <span className="text-xl">{item.title}</span>
                        </span>
                        <RiAddLine
                          size={26}
                          className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
                          aria-hidden="true"
                        />
                      </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    <AccordionContent className="text-muted-foreground px-10 pb-2 text-lg">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
