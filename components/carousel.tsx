"use client";

import Image from 'next/image';
import { motion } from "framer-motion";

export default function Carousel({ className }: { className?: string }) {
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
                        x: [0, -1432], // Move exactly the width of 6 images + gaps for seamless loop
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


                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump1.jpg"
                                        alt="Carousel Image 7"
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
                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump2.jpg"
                                        alt="Carousel Image 8"
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
                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump1.jpg"
                                        alt="Carousel Image 7"
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
                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump2.jpg"
                                        alt="Carousel Image 8"
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
                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump1.jpg"
                                        alt="Carousel Image 7"
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
                    <li style={{ width: "400px", height: "300px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                    <Image
                                        width={400}
                                        height={300}
                                        sizes="400px"
                                        src="/dump2.jpg"
                                        alt="Carousel Image 8"
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
                </motion.ul>
            </section>
        </div>
    );
}
