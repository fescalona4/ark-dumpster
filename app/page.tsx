import Carousel from "@/components/carousel";
import Stats from "@/components/stats";
import Image from "next/image";
import ServiceSection from "@/app/services/services";
import Testimonials from "@/components/testimonials";
import Contacts from "@/app/contact/contact";
import AboutSection from "@/app/about/about";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main>

      {/* Top Section */}
      <div className="min-h-[95vh] bg-neutral-900 max-md:p-6">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-4 md:p-6 md:mb-36 min-h-[95vh] rounded-lg max-md:bg-gradient-to-r from-orange-900/70 via-orange-800/70 to-rose-900/70">
          {/* Left Side Content */}
          <div className="flex flex-col justify-center items-start px-10 mt-8">
            <div className="mx-auto px-10 mt-8">
              <div className="flex flex-col gap-8">
                <div className="flex-1 mt-2">
                  <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5">
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    ></span>
                    Available for work
                  </Badge>
                  <h1 className="text-5xl text-foreground pt-2 flex items-center">
                    Your trusted partner for reliable dumpster rental services.
                  </h1>
                </div>
                <div className="flex-3">
                  <p className="text-2xl bold leading-relaxed pr-10">

                    Whether you are tackling a home renovation, construction project, or major cleanout,
                    Ark Dumpster provides convenient, affordable waste management solutions.
                    <span className="align-super bold text-2xl">®</span>
                    {/* With our commitment to exceptional service and competitive pricing, 
              we make waste disposal simple so you can focus on what matters most. */}
                  </p>
                  <div className="w-fit py-8">
                    <Link
                      href="/contact"
                      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-neutral-700 md:bg-neutral-700 max-md:bg-white/10 max-md:backdrop-blur-md max-md:border-white/30 text-foreground hover:bg-foreground/90 text-lg h-14 px-8"
                    >
                      Get in touch
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="rounded-lg md:bg-gradient-to-r from-orange-900/70 via-orange-800/70 to-rose-900/70">
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
      <AboutSection />

      {/* Carousel Section - Image slideshow/gallery */}
      <Carousel className="mt-12" />

      {/* Statistics Section - Key company metrics and achievements */}
      <Stats />

      {/* Services Section - Available dumpster rental services */}
      <ServiceSection />

      {/* Testimonials Section - Customer reviews and feedback */}
      <Testimonials />

      {/* Contact Section - Contact form and information */}
      <Contacts />

    </main>
  );
}
