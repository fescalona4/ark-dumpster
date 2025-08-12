'use client';

import { PlusIcon, Trash, TreeDeciduous, Container } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion';

const items = [
  {
    id: '1',
    icon: Container,
    title: 'Dumpster Rental',
    content:
      'We offer flexible dumpster rental options to suit your project needs. Our dumpsters come in various sizes, making it easy to find the perfect fit for your residential or commercial project. With prompt delivery and pickup, we ensure a hassle-free experience.',
  },
  {
    id: '2',
    icon: TreeDeciduous,
    title: 'Tree Services',
    content:
      'We provide expert tree services, including trimming, pruning, and removal. Our team is equipped to handle trees of all sizes, ensuring safety and efficiency. Whether you need routine maintenance or emergency tree removal, we have the expertise to manage your needs.',
  },
  {
    id: '3',
    icon: Trash,
    title: 'Junk Removal',
    content:
      'We offer comprehensive junk removal services for residential and commercial properties. Our team handles everything from furniture and appliances to yard waste and construction debris, ensuring your space is clutter-free and ready for use.',
  },
];

export default function ServiceSection() {
  return (
    <motion.section
      id="services"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex flex-col items-center">
        <div className="max-w-screen-xl px-10 mt-36 flex justify-center">
          <div className="flex-1 mt-2 items-center text-center max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 text-sm px-2 py-0.5 border-black dark:border-border"
            >
              Services
            </Badge>
            <h1 className="text-5xl text-foreground mb-4 pt-2 flex items-center justify-center">
              What we do
            </h1>
            <h3 className="text-xl font-light">
              Find out which one of our services fits your project needs
            </h3>
          </div>
        </div>

        {/* Accordion */}
        <div className="max-w-screen-xl space-y-4 mx-6 md:mx-32 mt-16">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="1"
          >
            {items.map(item => (
              <AccordionItem value={item.id} key={item.id} className="py-2">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-2 text-left text-sm text-[15px] leading-6 font-semibold transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0">
                    <span className="flex items-center gap-3">
                      <item.icon
                        size={26}
                        className="shrink-0 opacity-60"
                        aria-hidden="true"
                      />
                      <span className="text-xl">{item.title}</span>
                    </span>
                    <PlusIcon
                      size={26}
                      className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
                      aria-hidden="true"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="text-muted-foreground px-10 pb-2 text-lg">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </motion.section>
  );
}
