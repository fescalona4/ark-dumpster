'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Marquee from '@/components/ui/marquee';
import { StarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Elegant Marble & Granite Design Corp',
    designation: 'Home Renovation',
    testimonial:
      "I recently hired ARK Dumpster Rentals and More Corp. for tree cutting services, and I couldn't be happier with the results. The team was incredibly efficient and completed the job on time. They left the area spotless, with no damage to surrounding property. I highly recommend their services 100% and will definitely be hiring them again for our future projects!",
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 2,
    name: 'Michelle Amiel',
    designation: 'Homeowner',
    testimonial:
      'Words cannot explain how amazing ARK dumpster co was. We lost all our belongings to Hurricane Helene and had no way of getting the trash hauled out. They picked up on a weekend and were there within a day with two men to help load. We needed two loads and they were back within hours to complete the job. Thank you so much!!',
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
  },
  {
    id: 3,
    name: 'Art Vandelay',
    designation: 'Homeowner',
    testimonial:
      'Katherine was great! Fast service and great communication. They had a dumpster dropped next day and picked up promptly. Will work with Ark again.',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 4,
    name: 'Alexander Kurteev',
    designation: 'Homeowner',
    testimonial:
      'Exceptional service, called for a dumpster. Same day was delivered, easy communication. I will also use this guys for tree removal as the price I received was reasonable.',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
  {
    id: 5,
    name: 'Omar Molina',
    designation: 'General Contractor',
    testimonial:
      "I reached out and quickly had an outstanding price with same day drop off. I was impressed with the condition of the equipment, I've worked around trailers with issues and know the difficulty so I inspected and could not find one single thing wrong. When the first load was ready ARK was notified and in no time I realized it had been dumped and replaced. Very satisfied experience.",
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
  },
  {
    id: 6,
    name: 'Julianne',
    designation: 'Homeowner',
    company: 'Largo',
    testimonial:
      'Highly recommended. Made the process as easy as possible even in the high stress times of a hurricane. Wouldn’t use anyone else for dumpster rental!',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 7,
    name: 'Karla Eguiguren',
    designation: 'Homeowner',
    company: 'Largo',
    testimonial:
      'Excellent service. They’re great at tree service. Great pricing and good work, they are also licensed and insured!',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
];

const Testimonials = () => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
  >
    <div className="min-h-screen flex justify-center items-center py-12">
      <div className="h-full w-full">
        <div className="mx-auto px-10 mt-28 mb-16 flex justify-center">
          <div className="flex-1 mt-2 items-center text-center max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 text-sm px-2 py-0.5 border-black dark:border-border"
            >
              Testimonials
            </Badge>
            <h1 className="text-5xl text-foreground mb-4 pt-2 flex items-center justify-center">
              Hear from our clients
            </h1>
            <h3 className="text-xl font-light">
              Hear from our happy clients about their experience working with ARK Dumpster and the
              quality of our service.
            </h3>
          </div>
        </div>
        <div className="relative">
          <div className="z-10 absolute left-0 inset-y-0 w-[15%] bg-gradient-to-r from-background to-transparent" />
          <div className="z-10 absolute right-0 inset-y-0 w-[15%] bg-gradient-to-l from-background to-transparent" />
          <Marquee pauseOnHover className="[--duration:180s]">
            <TestimonialList />
          </Marquee>
          <Marquee pauseOnHover reverse className="mt-0 [--duration:180s]">
            <TestimonialList />
          </Marquee>
        </div>
      </div>
    </div>
  </motion.div>
);

const TestimonialList = () =>
  testimonials.map(testimonial => (
    <div key={testimonial.id} className="flex flex-col outline outline-border px-6 py-8">
      <div className="flex gap-2">
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
      </div>
      <p className="my-6 text-[17px] max-w-md">&quot;{testimonial.testimonial}&quot;</p>
      <div className="mt-auto flex gap-3">
        <Avatar>
          <AvatarFallback className="text-xl font-medium bg-primary text-primary-foreground">
            {testimonial.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{testimonial.name}</p>
          <p className="text-sm text-gray-500">{testimonial.designation}</p>
        </div>
      </div>
    </div>
  ));

export default Testimonials;
