"use client";

import Carousel from "@/components/carousel";
import Stats from "@/components/stats";
import Image from "next/image";
import ServiceSection from "@/app/services/services";
import Testimonials from "@/components/testimonials";
import Contacts from "@/app/contact/contact";
import AboutSection from "@/app/about/about";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main>

      {/* Top Section */}
      <div className="min-h-[95vh] bg-neutral-900/98 dark:bg-neutral-900 max-md:px-2 max-md:py-4">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-4 max-md:pt-36 md:p-6 md:mb-36 min-h-[95vh] rounded-lg max-md:bg-gradient-to-r from-orange-900/80 via-orange-800/70 to-rose-900/90 dark:from-orange-900/70 dark:via-orange-800/70 dark:to-rose-900/70">
          {/* Left Side Content */}
          <div className="flex flex-col justify-center items-start md:px-10 mt-8 text-white">
            <div className="mx-auto px-6 md:px-10 mt-8">
              <div className="flex flex-col gap-8">
                <div className="flex-1 mt-2">
                  <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5 text-white">
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    ></span>
                    Available for work
                  </Badge>
                  <h1 className="text-5xl pt-2 flex items-center">
                    Your trusted partner for reliable dumpster rental services.
                  </h1>
                </div>
                <div className="flex-3">
                  <p className="text-2xl font-light leading-relaxed pr-10">

                    Whether you are tackling a home renovation, construction project, or major cleanout,
                    Ark Dumpster provides convenient, affordable waste management solutions.
                    <span className="align-super bold text-2xl">®</span>
                    {/* With our commitment to exceptional service and competitive pricing, 
              we make waste disposal simple so you can focus on what matters most. */}
                  </p>
                  <div className="w-fit py-8">
                    <Link
                      href="/contact"
                      className="rounded-full border border-solid transition-colors flex items-center justify-center bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-neutral-600/70 text-lg h-14 px-8"
                    >
                      Get in touch
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="rounded-lg md:bg-gradient-to-r from-orange-900/80 via-orange-800/70 to-rose-900/90 dark:from-orange-900/70 dark:via-orange-800/70 dark:to-rose-900/70">
            <div className="w-full h-full flex justify-center items-center">
              <Image
                src="/ark-background.svg"
                alt="Ark Dumpster"
                width={900}
                height={900}
              />
            </div>
          </div>
        </div>
      </div>


      {/* About Section - Company introduction and overview */}
      <motion.section 
        id="about"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AboutSection />
      </motion.section>

      {/* Carousel Section - Image slideshow/gallery */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <Carousel className="mt-12" />
      </motion.div>

      {/* Statistics Section - Key company metrics and achievements */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <Stats />
      </motion.div>

      {/* Services Section - Available dumpster rental services */}
      <motion.section 
        id="services"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <ServiceSection />
      </motion.section>

      {/* Testimonials Section - Customer reviews and feedback */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <Testimonials />
      </motion.div>

      {/* Contact Section - Contact form and information */}
      <motion.section 
        id="contact"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
      >
        <Contacts />
      </motion.section>

    </main>
  );
}
