import Carousel from "@/components/carousel";
import { Badge } from "@/components/ui/badge"
import Separator from "@/components/separator";
import Stats from "@/components/stats";
import Image from "next/image";
import Link from 'next/link';
import ServiceSection from "@/components/services";

export default function Home() {
  return (
    <main className="pb-24">
      <div className="w-full flex justify-center items-start mt-4">
        <Image
          src="/ark-background.svg"
          alt="Ark Dumpster"
          width={900}
          height={900}
        />
      </div>

      {/* <Separator className="mx-10 mt-12 mb-16"/> */}

      <div className="mx-auto px-10 mt-8">
        <div className="flex flex-col md:flex-row gap-16">
          <div className="flex-1 mt-2">
            <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5">
              <span
                className="size-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              ></span>
              Available for work
            </Badge>
            <h1 className="text-5xl text-foreground mb-4 pt-2 flex items-center">
              dumpster rental specialists
            </h1>
          </div>
          <div className="flex-3">
            <p className="text-2xl bold leading-relaxed pr-10">
              Your trusted partner for reliable dumpster rental services.
              Whether you are tackling a home renovation, construction project, or major cleanout,
              Ark Dumpster provides convenient, affordable waste management solutions.
              <span className="align-super bold text-2xl">®</span>
              {/* With our commitment to exceptional service and competitive pricing, 
              we make waste disposal simple so you can focus on what matters most. */}
            </p>
            <div className="w-fit py-16">
              <Link
                href="/get-started"
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 font-medium text-sm h-10 px-6"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Carousel className="mt-12" />

      <Stats />

      
      <ServiceSection />



      <Separator className="mx-10 mt-12 mb-16" />



      <div className="mx-auto px-10 mt-8">
        <div className="flex flex-col md:flex-row gap-16">
          <div className="flex-1">
            <h1 className="text-lg text-foreground mb-4 pt-4 flex items-center">
              <span className="w-3 h-3 mr-3" style={{ backgroundColor: '#f9452c', borderRadius: '3px' }}></span>
              Dumpster / trailer Rental
            </h1>
          </div>
          <div className="flex-3">
            <div className="flex flex-col space-y-2">
              {/* <div className="text-center mt-6 text-xl font-semibold text-foreground">Best prices in the area</div> */}
              <h3 className="text-lg font-semibold">You fill, we haul!</h3>
              <h3 className="text-lg font-semibold">BBB Accredited  </h3>
              <h3 className="text-lg font-semibold">Driveway protection available</h3>
              <h3 className="text-lg font-semibold">Licensed & Insured</h3>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
