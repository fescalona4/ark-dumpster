import Carousel from "@/components/carousel";
import Stats from "@/components/stats";
import Image from "next/image";
import ServiceSection from "@/app/services/services";
import Testimonials from "@/components/testimonials";
import Contacts from "@/app/contact/contact";
import AboutSection from "@/app/about/about";

export default function Home() {
  return (
    <main>
      <div className="w-full flex justify-center items-start mt-4">
        <Image
          src="/ark-background.svg"
          alt="Ark Dumpster"
          width={900}
          height={900}
        />
      </div>

      {/* <Separator className="mx-10 mt-12 mb-16"/> */}

      <AboutSection />

      <Carousel className="mt-12" />

      <Stats />

      <ServiceSection />

      <Testimonials />

      <Contacts />

    </main>
  );
}
