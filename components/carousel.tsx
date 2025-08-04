"use client";

import { motion } from "framer-motion";

export default function Carousel() {
    return (
        <div style={{
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
                        x: [0, -2432], // Move exactly the width of 6 images + gaps for seamless loop
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
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-cwf5tq-container" data-framer-name="Ticker Image 1" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png?scale-down-to=512 512w,https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png?scale-down-to=1024 1024w,https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png 1200w"
                                            src="https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png"
                                            alt="Carousel Image 1"
                                           
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1njhf5m-container" data-framer-name="Ticker Image 2" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                              
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png?scale-down-to=1024 764w,https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png 896w"
                                            src="https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png"
                                            alt="Carousel Image 2"
                      
                                        />
                                   
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-djbkjw-container" data-framer-name="Ticker Image 4" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png?scale-down-to=1024 819w,https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png 960w"
                                            src="https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png"
                                            alt="Carousel Image 4"
                                          
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="300"
                                            sizes="400px"
                                            src="/dump1.jpg"
                                            alt="Carousel Image 7"
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="300"
                                            sizes="400px"
                                            src="/dump2.jpg"
                                            alt="Carousel Image 8"
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    {/* Duplicate images for seamless infinite scroll */}
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-cwf5tq-container" data-framer-name="Ticker Image 1 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png?scale-down-to=512 512w,https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png?scale-down-to=1024 1024w,https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png 1200w"
                                            src="https://framerusercontent.com/images/bwP8CYttC1lINgPtK7lQja0.png"
                                            alt="Carousel Image 1"
                                           
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1njhf5m-container" data-framer-name="Ticker Image 2 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png?scale-down-to=1024 764w,https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png 896w"
                                            src="https://framerusercontent.com/images/RbmRrHiT87wxDx7Cox6FOA1sM3k.png"
                                            alt="Carousel Image 2"
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-djbkjw-container" data-framer-name="Ticker Image 4 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="500"
                                            sizes="400px"
                                            srcSet="https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png?scale-down-to=1024 819w,https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png 960w"
                                            src="https://framerusercontent.com/images/A7yE2PBsrF4l2EgA4yTO9HiAcPQ.png"
                                            alt="Carousel Image 4"
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="300"
                                            sizes="400px"
                                            src="/dump1.jpg"
                                            alt="Carousel Image 7"
                                        />
                                </div>
                            </div>
                        </div>
                    </li>
                    <li style={{ width: "400px", height: "400px" }}>
                        <div className="framer-1cosb6b-container" data-framer-name="Ticker Image 6 Duplicate" style={{ width: "400px", height: "100%", flexShrink: 0 }}>
                            <div className="framer-8dscJ framer-1cr5qt0 framer-v-1cr5qt0" data-framer-name="Variant 1" style={{ backgroundColor: "rgb(255, 255, 255)", height: "100%", width: "100%", opacity: 1 }}>
                                <div className="framer-16a69do" data-framer-name="Image" style={{ opacity: 1 }}>
                                        <img
                                            decoding="async"
                                            width="400"
                                            height="300"
                                            sizes="400px"
                                            src="/dump2.jpg"
                                            alt="Carousel Image 8"
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
