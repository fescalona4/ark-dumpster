'use client';

import React from 'react';
import { RiAddLine, RiDeleteBinLine, RiPlantLine, RiArchiveLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';

// Define service types
interface ServiceImages {
  dump: string[];
  junk: string[];
  tree: string[];
}

interface ServiceItem {
  id: string;
  icon: string; // Changed from any to string
  title: string;
  folder: keyof ServiceImages;
  content: string;
}

interface ServicesClientProps {
  items: ServiceItem[];
  serviceImages: ServiceImages;
}

// Icon mapping
const iconMap = {
  RiArchiveLine,
  RiPlantLine,
  RiDeleteBinLine,
} as const;

export default function ServicesClient({ items, serviceImages }: ServicesClientProps) {
  const [activeItem, setActiveItem] = useState('1');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when switching services
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
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex flex-col items-center">
        <div className="max-w-screen-xl px-10 mt-36 flex justify-center">
          <div className="flex-1 mt-2 items-center text-center max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 text-sm md:text-xs px-2 py-0.5 border-black dark:border-border"
            >
              Services
            </Badge>
            <h1 className="text-5xl md:text-4xl text-foreground mb-4 pt-2 flex items-center justify-center">
              What we do
            </h1>
            <h3 className="text-xl md:text-lg font-light">
              Find out which one of our services fits your project needs
            </h3>
          </div>
        </div>

        {/* Services Layout with Dynamic Image and Accordion */}
        <div className="max-w-screen-xl mx-6 md:mx-16 mt-16">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            {/* Left Side - Dynamic Image */}
            <div className="space-y-4 max-lg:mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="relative h-96 rounded-lg overflow-hidden shadow-lg"
                >
                  {currentImageUrl ? (
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:bg-black/70 transition-colors"
                            aria-label="Previous image"
                          >
                            <RiArrowLeftSLine size={20} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:bg-black/70 transition-colors"
                            aria-label="Next image"
                          >
                            <RiArrowRightSLine size={20} />
                          </button>

                          {/* Image Indicators */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {currentImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                  ? 'bg-white/90 shadow-md'
                                  : 'bg-white/40 hover:bg-white/70'
                                  }`}
                                aria-label={`View image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        {React.createElement(iconMap[currentItem.icon as keyof typeof iconMap], { size: 48, className: "mx-auto mb-4 text-gray-400" })}
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
                          {React.createElement(iconMap[item.icon as keyof typeof iconMap], { size: 26, className: "shrink-0 opacity-60", "aria-hidden": "true" })}
                          <span className="text-xl">{item.title}</span>
                        </span>
                        <RiAddLine
                          size={26}
                          className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
                          aria-hidden="true"
                        />
                      </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    <AccordionContent className="text-muted-foreground px-10 pb-2 text-lg font-light">
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
