"use client";

import { motion } from "framer-motion";

export default function Stats() {
    return (
        <div className="flex items-center justify-center">
            <div className="max-w-screen-xl w-full mx-6 md:mx-20">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Reliable dumpster rental services for the
                    <span className="relative inline-block">
                        <motion.span
                            className="bg-gradient-to-r from-orange-300 via-red-200 to-pink-400 bg-clip-text text-transparent"
                            initial={{ backgroundPosition: "-100% 0" }}
                            animate={{ backgroundPosition: "100% 0" }}
                            transition={{
                                duration: 5,
                                ease: "easeOut",
                                delay: 0.2,
                                repeat: Infinity,
                                repeatDelay: 0.2,
                                repeatType: "reverse",
                            }}
                            style={{ backgroundSize: "200% 100%" }}
                        >
                            St Petersburg &amp; Tampa Bay
                        </motion.span>
                    </span> area
                </h2>
                <p className="mt-6 text-lg max-w-4xl text-foreground/70">
                    ARK Dumpster provides professional waste management solutions for
                    residential and commercial projects. With our commitment to exceptional
                    service and competitive pricing, we make waste disposal simple.
                </p>

                <div className="mt-16 sm:mt-24 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-16 justify-center">
                    <div>
                        <span className="text-5xl md:text-7xl font-light">
                            8
                        </span>
                        <p className="mt-6 font-semibold text-xl">Years experience</p>
                        <p className="mt-2 text-muted-foreground">
                            From home renovations to large construction sites, we&apos;ve handled
                            it all with professional service.
                        </p>
                    </div>
                    <div>
                        <span className="text-5xl md:text-7xl font-light">
                            200+
                        </span>
                        <p className="mt-6 font-semibold text-xl">Projects completed</p>
                        <p className="mt-2 text-muted-foreground">
                            From home renovations to large construction sites, we&apos;ve handled
                            it all with professional service.
                        </p>
                    </div>
                    <div>
                        <span className="text-5xl md:text-7xl font-light">
                            24/7
                        </span>
                        <p className="mt-6 font-semibold text-xl">Customer support</p>
                        <p className="mt-2 text-muted-foreground">
                            Our dedicated team is available around the clock to assist with your
                            waste management needs.
                        </p>
                    </div>
                    {/* <div>
            <span className="text-5xl md:text-6xl font-bold">
              15+
            </span>
            <p className="mt-6 font-semibold text-xl">
              Dumpster sizes available
            </p>
            <p className="mt-2 text-muted-foreground">
              Multiple container sizes from 10 to 40 yards to fit any project
              requirement.
            </p>
          </div> */}
                    <div>
                        <span className="text-5xl md:text-7xl font-light">
                            100%
                        </span>
                        <p className="mt-6 font-semibold text-xl">Client satisfaction</p>
                        <p className="mt-2 text-muted-foreground">
                            All of our clients are satisfied with our work and service
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

