import { RiAddLine, RiDeleteBinLine, RiPlantLine, RiArchiveLine, RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getImageUrl, listImages } from '@/lib/supabase-storage';
import ServicesClient from './services-client';

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
    icon: 'RiArchiveLine',
    title: 'Dumpster Rental',
    folder: 'dump' as keyof ServiceImages,
    content:
      'We offer flexible dumpster rental options to suit your project needs. Our dumpsters come in various sizes, making it easy to find the perfect fit for your residential or commercial project. With prompt delivery and pickup, we ensure a hassle-free experience.',
  },
  {
    id: '2',
    icon: 'RiPlantLine',
    title: 'Tree Services',
    folder: 'tree' as keyof ServiceImages,
    content:
      'We provide expert tree services, including trimming, pruning, and removal. Our team is equipped to handle trees of all sizes, ensuring safety and efficiency. Whether you need routine maintenance or emergency tree removal, we have the expertise to manage your needs.',
  },
  {
    id: '3',
    icon: 'RiDeleteBinLine',
    title: 'Junk Removal',
    folder: 'junk' as keyof ServiceImages,
    content:
      'We offer comprehensive junk removal services for residential and commercial properties. Our team handles everything from furniture and appliances to yard waste and construction debris, ensuring your space is clutter-free and ready for use.',
  },
];

// Server function to fetch all service images
async function getServiceImages(): Promise<ServiceImages> {
  const serviceImages: ServiceImages = {
    dump: [],
    junk: [],
    tree: []
  };

  // Fetch images dynamically from each folder
  for (const folder of serviceFolders) {
    try {
      console.log(`📁 Fetching images from ${folder} folder...`);
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

        serviceImages[folder] = imageFiles.map((file: any) =>
          getImageUrl(`${folder}/${file.name}`)
        );

        console.log(`✅ Found ${imageFiles.length} images in ${folder} folder`);
      } else {
        console.warn(`No images found in ${folder} folder`);
      }
    } catch (error) {
      console.warn(`Failed to fetch images from ${folder}:`, error);
    }
  }

  console.log('Final service images:', serviceImages);
  return serviceImages;
}

export default async function ServiceSection() {
  // Fetch images on the server
  const serviceImages = await getServiceImages();

  return (
    <ServicesClient 
      items={items}
      serviceImages={serviceImages}
    />
  );
}
