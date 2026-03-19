"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface NavbarProps {
  alwaysFrosted?: boolean;
  cartItemCount?: number;
  onCartClick?: () => void;
}

const IconCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export default function Navbar({ alwaysFrosted = false, cartItemCount, onCartClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (alwaysFrosted) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysFrosted]);

  const frosted = alwaysFrosted || scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-all duration-500 ${
        frosted ? "bg-cream/80 backdrop-blur-xl shadow-sm shadow-forest/5" : "bg-transparent"
      }`}
    >
      <Link href="/" className="font-playfair text-2xl text-forest tracking-tight">
        OFS<span className="text-clay italic">.</span>
      </Link>

      <div className="flex items-center gap-8">
        {onCartClick !== undefined ? (
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 bg-forest text-cream px-4 py-2.5 rounded-full text-sm font-medium hover:bg-sage transition-colors duration-200 shadow-md shadow-forest/20"
          >
            <IconCart />
            <span>Cart</span>
            {cartItemCount !== undefined && cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-clay text-cream text-[10px] font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        ) : (
          <>
            <Link href="/#how-it-works" className="hidden md:block text-sm font-medium text-forest/60 hover:text-forest transition-colors duration-200">
              How It Works
            </Link>
            <Link href="/#features" className="hidden md:block text-sm font-medium text-forest/60 hover:text-forest transition-colors duration-200">
              Features
            </Link>
            <Link
              href="/login-register"
              className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-sage transition-colors duration-200 shadow-md shadow-forest/20"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}