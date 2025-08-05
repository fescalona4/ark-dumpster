import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Marquee from "@/components/ui/marquee";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge"

const testimonials = [
  {
    id: 1,
    name: "Mike Rodriguez",
    designation: "Homeowner",
    company: "St. Petersburg",
    testimonial:
      "ARK Dumpster made our kitchen renovation so much easier! They delivered on time and picked up exactly when promised. Great service and fair pricing.",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    id: 2,
    name: "Sofia Hernandez",
    designation: "Construction Manager",
    company: "Tampa Bay Builders",
    testimonial:
      "We use ARK Dumpster for all our construction projects. Their reliability and variety of container sizes make them our go-to waste management partner.",
    avatar: "https://randomuser.me/api/portraits/women/6.jpg",
  },
  {
    id: 3,
    name: "Diego Marstons",
    designation: "Property Manager",
    company: "Clearwater Properties",
    testimonial:
      "Professional service from start to finish. The team was courteous, the dumpster was clean, and they protected our driveway perfectly. Highly recommend!",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    id: 4,
    name: "Sarah Garcia",
    designation: "Small Business Owner",
    company: "Tampa",
    testimonial:
      "We needed a dumpster for our office cleanout project. ARK Dumpster provided excellent customer service and helped us choose the perfect size container.",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    id: 5,
    name: "Carlos Martinez",
    designation: "General Contractor",
    company: "Pinellas County",
    testimonial:
      "Fast delivery, competitive prices, and they always show up when scheduled. ARK Dumpster has never let us down on any of our job sites.",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    id: 6,
    name: "Amanda Foster",
    designation: "Homeowner",
    company: "Largo",
    testimonial:
      "Amazing experience during our garage cleanout! The 20-yard dumpster was perfect, and their customer support answered all our questions promptly.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
];

const Testimonials = () => (
  <div className="min-h-screen flex justify-center items-center py-12">
    <div className="h-full w-full">
      <div className="mx-auto px-10 mt-28 mb-16 flex justify-center">
        <div className="flex-1 mt-2 items-center text-center max-w-2xl">
          <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5">
            Testimonials
          </Badge>
          <h1 className="text-5xl text-foreground mb-4 pt-2 flex items-center justify-center">
            Hear from our clients
          </h1>
          <h3 className="text-xl">
            Hear from our happy clients about their experience working with ARK Dumpster and the quality of our service.
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
);

const TestimonialList = () =>
  testimonials.map((testimonial) => (
    <div
      key={testimonial.id}
      className="flex flex-col outline outline-border px-6 py-8"
    >
      <div className="flex gap-2">
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
        <StarIcon className="w-4 h-4 fill-white stroke-orange-400" />
      </div>
      <p className="my-6 text-[17px] max-w-md">
        &quot;{testimonial.testimonial}&quot;
      </p>
      <div className="mt-auto flex gap-3">
        <Avatar>
          <AvatarFallback className="text-xl font-medium bg-primary text-primary-foreground">
            {testimonial.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{testimonial.name}</p>
          <p className="text-sm text-gray-500">
            {testimonial.designation}
          </p>
        </div>
      </div>
    </div>
  ));

export default Testimonials;
