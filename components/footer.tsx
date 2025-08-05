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
    <div className="min-h-screen flex flex-col">
      <div className="grow bg-muted" />
      <footer>
        <div className="max-w-screen-xl mx-auto">
          <div className="py-12 flex flex-col justify-start ml-12">
            {/* Logo and Quick Links Header */}
            <div className="flex items-center justify-between mr-12">
              <div className="flex items-center space-x-2">
                <Image
                  src="/ark-logo.svg"
                  alt="Ark Dumpster Logo"
                  className="w-8 h-8 object-contain"
                  width={42}
                  height={42}
                />
                <span className="font-semibold text-xl text-foreground">
                  ARK
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Quick Links
              </h3>
            </div>

            <ul className="mt-6 mr-12 grid grid-cols-2 gap-x-4 gap-y-2 justify-items-end w-fit ml-auto">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground font-medium"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="py-8 ml-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            {/* Copyright */}
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()}{" "}
              <Link href="/" target="_blank">
                ARK Dumpsters
              </Link>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted-foreground">
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
