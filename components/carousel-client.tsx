"use client";

import Image from 'next/image';
import { FadeInAnimation, MoveSidewayAnimation } from './animated-components';

interface CarouselImage {
    name: string;
    url: string;
}

interface CarouselClientProps {
    images: CarouselImage[];
    className?: string;
}

export default function CarouselClient({ images, className }: CarouselClientProps) {
    if (images.length === 0) {
        return (
            <div className={className} style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>No images found</div>
            </div>
        );
    }

    return (
        <FadeInAnimation>
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
                    <MoveSidewayAnimation children={
                        images.map((image, index) => (
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
                        ))
                    } />
                </section>
            </div>
        </FadeInAnimation>
    );
}
