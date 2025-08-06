"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const scrollUpDistance = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      
      // Always show header when at the top of the page
      if (currentScrollY <= 50) {
        setIsHeaderVisible(true);
        scrollUpDistance.current = 0; // Reset scroll distance when at top
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (scrollDirection === 'up') {
        // Track upward scroll distance
        scrollUpDistance.current += lastScrollY.current - currentScrollY;

        // Show header after scrolling up 500px or more
        if (scrollUpDistance.current >= 500 && window.innerWidth < 768) {
          setIsHeaderVisible(true);
        }
      } else {
        // Reset upward scroll distance when scrolling down
        scrollUpDistance.current = 0;
        
        // Hide header after 1 second of no scrolling (mobile only)
        scrollTimeoutRef.current = setTimeout(() => {
          if (window.innerWidth < 768) {
            setIsHeaderVisible(false);
          }
        }, 1000);
      }

      lastScrollY.current = currentScrollY;
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.header 
      className="w-full bg-transparent md:bg-transparent fixed top-0 md:top-10 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: isHeaderVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div ref={menuRef} className="px-4 sm:px-6 lg:px-8 bg-black/60 backdrop-blur-md rounded-lg mx-8 mt-8 md:bg-transparent md:backdrop-blur-none md:rounded-none md:mx-0 md:mt-0">
        <div className="flex justify-between items-center md:grid md:grid-cols-2 h-16">
          {/* Logo */}
          <div className="flex-shrink-0 md:ml-20">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/ark-logo.svg"
                alt="Ark Dumpster Logo"
                className="object-contain"
                width={42}
                height={42}
              />
              <span className="font-semibold text-3xl text-gray-100/90 max-md:hidden">
                ARK
              </span>
            </Link>
          </div>

          {/* Right side container for nav and CTA */}
          <div className="flex items-center justify-end space-x-16 md:ml-12">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 lg:space-x-16">
              <Link
                href="/"
                className="text-foreground hover:text-foreground/80 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-foreground hover:text-foreground/80 transition-colors font-medium"
              >
                About
              </Link>
              <Link
                href="/services"
                className="text-foreground hover:text-foreground/80 transition-colors font-medium"
              >
                Services
              </Link>
              <Link
                href="/contact"
                className="text-foreground hover:text-foreground/80 transition-colors font-medium"
              >
                Contact
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-foreground hover:text-foreground/80 transition-colors p-2"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 20L20 4M4 4l16 16"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2 6h20M2 12h20M2 18h20"
                    />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-black/[.08] dark:border-white/[.145] mt-2 pt-8 pb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <nav className="flex flex-col space-y-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <Link
                    href="/"
                    className="text-foreground hover:text-foreground/80 transition-colors font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Link
                    href="/about"
                    className="text-foreground hover:text-foreground/80 transition-colors font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <Link
                    href="/services"
                    className="text-foreground hover:text-foreground/80 transition-colors font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Services
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Link
                    href="/contact"
                    className="text-foreground hover:text-foreground/80 transition-colors font-medium text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}