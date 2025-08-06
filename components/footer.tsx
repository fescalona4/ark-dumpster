import { Separator } from "@/components/ui/separator";
import {
  Instagram,
  Facebook,
} from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

const footerLinks = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Services",
    href: "/services",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

const Footer = () => {
  return (
    <div className="flex flex-col mx-4 rounded-t-lg bg-gradient-to-r from-orange-900/70 via-orange-800/70 to-rose-900/70">
      <footer>
        <div className="">
          <div className="py-12 flex flex-col justify-between ml-6 sm:ml-16 sm:mr-12">
            {/* Logo and Quick Links Header */}
            <div className="flex items-center justify-between mr-12">
              <div className="flex items-center space-x-2">
                <Image
                  src="/ark-logo.svg"
                  alt="Ark Dumpster Logo"
                  className="object-contain"
                  width={60}
                  height={60}
                />
                <span className="font-semibold text-5xl text-gray-100/70 max-md:hidden">
                  ARK
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground ">
                Quick Links
              </h3>
            </div>

            <ul className="mt-6 mr-12 grid grid-cols-2 gap-x-4 gap-y-2 justify-items-end w-fit ml-auto">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-gray-300 hover:text-foreground font-medium"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="py-8 ml-6 sm:ml-14 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            {/* Copyright */}
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()}{" "}
              <Link href="/" target="_blank">
                ARK Dumpsters
              </Link>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 sm:pr-17 text-muted-foreground">
              <Link href="#" target="_blank">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" target="_blank">
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
