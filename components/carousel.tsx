"use client";

import Image from 'next/image';
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { listImages, getImageUrl } from '@/lib/supabase-storage';

interface CarouselImage {
  name: string;
  url: string;
}

export default function Carousel({ className }: { className?: string }) {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCarouselImages();
    }, []);

    const loadCarouselImages = async () => {
        try {
            // Load images from the 'carousel' folder
            const { data, error } = await listImages('carousel');

            if (error) {
                console.error('Error accessing carousel folder:', error);
                // Fallback to default images
                setImages([
                    { name: 'dump1.jpg', url: '/dump1.jpg' },
                    { name: 'dump2.jpg', url: '/dump2.jpg' },
                    { name: 'dump1.jpg', url: '/dump1.jpg' },
                    { name: 'dump2.jpg', url: '/dump2.jpg' },
                ]);
                return;
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
                        console.log(`� Generated URL for ${file.name}: ${url}`);
                        return {
                            name: file.name,
                            url: url
                        };
                    });

                console.log('🖼️ Processed image files:', imageFiles);

                if (imageFiles.length > 0) {
                    // Duplicate images for seamless scrolling
                    setImages([...imageFiles, ...imageFiles]);
                    console.log('🎯 Set carousel images successfully');
                } else {
                console.warn('No valid image files found in carousel folder');
                // Fallback to default images
                setImages([
                    { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
                    { name: 'dump2.jpg', url: '/dump2.jpg' },
                    { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
                    { name: 'dump2.jpg', url: '/dump2.jpg' },
                ]);
            }
        } else {
            // Folder exists but appears empty, let's check the root bucket too
            console.warn('📁 Carousel folder appears empty, checking root bucket...');
            
            // Try listing root bucket to see what's there
            const { data: rootData, error: rootError } = await listImages('');
            console.log('🌍 Root bucket contents:', { rootData, rootError });
            
            setImages([
                { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
                { name: 'dump2.jpg', url: getImageUrl('carousel/dump2.jpg') },
                { name: 'dump3.jpg', url: getImageUrl('carousel/dump3.jpg') },
                { name: 'dump4.jpg', url: getImageUrl('carousel/dump4.jpg') },
            ]);
        }
    } catch (err) {
        console.error('Error loading carousel images:', err);
            // Fallback to working URL format
            setImages([
                { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
                { name: 'dump2.jpg', url: '/dump2.jpg' },
                { name: 'dump1.jpg', url: getImageUrl('carousel/dump1.jpg') },
                { name: 'dump2.jpg', url: '/dump2.jpg' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate animation distance based on number of images
    const imageWidth = 400;
    const gap = 32;
    const singleSetWidth = images.length > 0 ? (images.length / 2) * (imageWidth + gap) : 1432;

    if (loading) {
        return (
            <div className={className} style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>Loading carousel images...</div>
            </div>
        );
    }
    return (
        <div
            className={className}
            style={{
                alignContent: "center",
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                flexWrap: "nowrap",
                gap: "40px",
                height: "400px",
                justifyContent: "center",
                overflow: "visible",
                padding: 0,
                position: "relative"
            }}>



            <section style={{
                display: "flex",
                placeItems: "center",
                margin: "0px",
                padding: "0px",
                listStyleType: "none",
                opacity: 1,
                overflow: "hidden",
                width: "100%",
                height: "100%",
            }}>
                <motion.ul
                    animate={{
                        x: [0, -singleSetWidth], // Move exactly the width of one set for seamless loop
                    }}
                    transition={{
                        duration: 120, // 120 seconds for full cycle
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        display: "flex",
                        placeItems: "flex-start",
                        margin: "0px",
                        padding: "0px",
                        listStyleType: "none",
                        gap: "32px",
                        position: "relative",
                        flexDirection: "row",
                        willChange: "transform",
                        width: "calc(200%)", // Double width for seamless scrolling
                        height: "100%",
                    }}>

                    {images.map((image, index) => (
                        <li key={`${image.name}-${index}`} style={{ width: "400px", height: "300px" }}>
                            <div className="framer-1cosb6b-container" data-framer-name="Ticker Image" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                                <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                    <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <Image
                                            src={image.url}
                                            alt={`Carousel Image ${index + 1}`}
                                            width={400}
                                            height={300}
                                            sizes="400px"
                                            priority={index < 4} // Prioritize first 4 images for better performance
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                borderRadius: "inherit",
                                                objectPosition: "center",
                                                objectFit: "cover"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </motion.ul>
            </section>
        </div>
    );
}
