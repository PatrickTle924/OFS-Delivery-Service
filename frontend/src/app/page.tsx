"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const MARQUEE_ITEMS: string[] = [
  "Fresh Produce", "Organic Meats", "Local Dairy",
  "Seasonal Fruits", "Farm Vegetables", "Artisan Breads",
];

interface Step {
  n: string;
  title: string;
  desc: string;
  accent: string;
}

interface Feature {
  title: string;
  desc: string;
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Browse & Add to Cart",
    desc: "Explore our full catalog of organic goods. Filter by category, search by name, and add items — your cart tracks total price and weight in real time.",
    accent: "from-mint/30 to-sage/10",
  },
  {
    n: "02",
    title: "Checkout Securely",
    desc: "Enter your delivery address and pay safely via Stripe. Orders under 20 lbs ship free; heavier orders include a flat $10 delivery fee.",
    accent: "from-clay/20 to-warm/40",
  },
  {
    n: "03",
    title: "Track Your Delivery",
    desc: "Watch your order move from our store to your door. Our smart routing system dispatches self-driving robots along the most efficient path.",
    accent: "from-sage/20 to-mint/10",
  },
];

const IconPin = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const IconPackage = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

const IconShield = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2l7 4v6c0 4.418-3.134 8.547-7 10C8.134 20.547 5 16.418 5 12V6l7-4z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const IconChart = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);

const FEATURES: Feature[] = [
  {
    title: "Smart Route Optimization",
    desc: "Our system solves the Traveling Salesman Problem with MapBox to find the fastest, most fuel-efficient delivery path.",
    gradient: "from-sage/10 to-mint/5",
    iconBg: "bg-gradient-to-br from-sage to-forest",
    icon: IconPin,
  },
  {
    title: "Real-Time Order Tracking",
    desc: "Live status updates from Processing to Out for Delivery to Delivered — always know where your order is.",
    gradient: "from-clay/8 to-warm/15",
    iconBg: "bg-gradient-to-br from-clay to-[#a86030]",
    icon: IconPackage,
  },
  {
    title: "Secure Payments",
    desc: "Stripe-powered checkout keeps your payment data safe. Role-based access control protects your account.",
    gradient: "from-forest/6 to-sage/8",
    iconBg: "bg-gradient-to-br from-forest to-[#2d5238]",
    icon: IconShield,
  },
  {
    title: "Admin Dashboard",
    desc: "Employees can manage inventory, dispatch deliveries, and monitor operations from a dedicated admin portal.",
    gradient: "from-warm/20 to-clay/5",
    iconBg: "bg-gradient-to-br from-[#b07848] to-clay",
    icon: IconChart,
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-cream relative">

      <div className="pointer-events-none fixed top-[-20%] left-[-15%] w-175 h-175 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.22)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.12)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed top-[40%] left-[30%] w-225 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.07)_0%,transparent_70%)] -z-10" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-5%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.15)_0%,transparent_65%)] -z-10" />

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-all duration-500 ${
          scrolled ? "bg-cream/80 backdrop-blur-xl shadow-sm shadow-forest/5" : "bg-transparent"
        }`}
      >
        <Link href="/" className="font-playfair text-2xl text-forest tracking-tight">
          OFS<span className="text-clay italic">.</span>
        </Link>
        <div className="flex items-center gap-8">
          <a href="#how-it-works" onClick={scrollTo("how-it-works")} className="hidden md:block text-sm font-medium text-forest/60 hover:text-forest transition-colors duration-200">
            How It Works
          </a>
          <a href="#features" onClick={scrollTo("features")} className="hidden md:block text-sm font-medium text-forest/60 hover:text-forest transition-colors duration-200">
            Features
          </a>
          <Link
            href="/login-register"
            className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-sage transition-colors duration-200 shadow-md shadow-forest/20"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center px-8 pt-32 pb-20 max-w-7xl mx-auto">
        <div className="pointer-events-none absolute top-[10%] right-[5%] w-120 h-120 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.35)_0%,rgba(74,124,89,0.08)_50%,transparent_70%)] blur-[2px]" />
        <div className="pointer-events-none absolute top-[25%] right-[20%] w-75 h-75 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.15)_0%,transparent_65%)]" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-mint/40 backdrop-blur-sm border border-mint/60 text-forest text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block animate-pulse" />
            Now delivering in San Jose
          </div>

          <h1 className="font-playfair text-6xl md:text-7xl lg:text-8xl text-forest leading-[1.05] tracking-tight mb-8">
            Fresh &amp;{" "}
            <em className="text-clay relative">
              Organic
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-linear-to-r from-clay/60 via-clay/30 to-transparent rounded-full" />
            </em>
            <br />
            <span className="text-forest/70">Delivered to</span>
            <br />
            Your Door
          </h1>

          <p className="text-lg text-[#3a3a30] font-light leading-relaxed max-w-lg mb-12">
            Browse handpicked organic produce from OFS and get it delivered fast —
            powered by smart routing, real-time tracking, and a seamless checkout experience.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="#"
              className="bg-forest text-cream font-medium px-8 py-4 rounded-full hover:bg-sage hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-forest/25 text-base"
            >
              Shop Now
            </Link>
            <Link
              href="/login-register"
              className="text-forest font-medium text-sm flex items-center gap-2 hover:gap-3.5 transition-all duration-200 group"
            >
              <span>Create Account</span>
              <span className="w-7 h-7 rounded-full border-[1.5px] border-forest/30 flex items-center justify-center group-hover:border-forest group-hover:bg-forest/5 transition-all duration-200">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-forest overflow-hidden py-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(168,213,181,0.08)_0%,transparent_70%)]" />
        <div className="flex gap-12 animate-marquee whitespace-nowrap w-max relative z-10">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-mint/80 text-xs font-medium tracking-[0.14em] uppercase">
              <span className="opacity-40 mr-4">✦</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative max-w-7xl mx-auto px-8 py-28">
        <div className="pointer-events-none absolute top-0 right-0 w-125 h-125 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)]" />

        <p className="text-sage text-xs font-medium tracking-[0.14em] uppercase mb-3">Simple Process</p>
        <h2 className="font-playfair text-4xl md:text-5xl text-forest leading-tight mb-16">
          From cart to{" "}
          <em className="text-clay">doorstep</em>
          <br />in three steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className={`relative bg-linear-to-br ${step.accent} rounded-3xl p-8 border border-white/80 shadow-lg shadow-forest/5 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-forest/10 transition-all duration-300 group overflow-hidden`}
            >
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.5)_0%,transparent_60%)] pointer-events-none" />
              <div className="relative z-10">
                <p className="font-playfair text-7xl text-forest/10 font-bold leading-none mb-6 group-hover:text-forest/15 transition-colors duration-300 select-none">
                  {step.n}
                </p>
                <h3 className="text-forest font-medium text-xl mb-3">{step.title}</h3>
                <p className="text-[#4a4a3a] text-sm font-light leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative max-w-7xl mx-auto px-8 pb-28">
        <div className="pointer-events-none absolute bottom-0 left-0 w-150 h-100 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.09)_0%,transparent_65%)]" />

        <p className="text-sage text-xs font-medium tracking-[0.14em] uppercase mb-3">Why OFS</p>
        <h2 className="font-playfair text-4xl md:text-5xl text-forest leading-tight mb-16">
          Everything you need,
          <br />
          <em className="text-clay ">nothing you don&apos;t</em>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`relative flex gap-5 items-start p-7 rounded-3xl bg-linear-to-br ${f.gradient} border border-white/70 shadow-sm hover:shadow-lg hover:shadow-forest/8 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.6)_0%,transparent_60%)] pointer-events-none" />
              <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center shrink-0 shadow-md text-cream`}>
                {f.icon}
              </div>
              <div className="relative z-10">
                <h3 className="text-forest font-medium text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#555] font-light leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="mx-8 mb-28 relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-forest" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(168,213,181,0.20)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(196,133,90,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_90%,rgba(74,124,89,0.25)_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

        <div className="relative z-10 px-10 py-24 text-center text-cream">
          <p className="text-mint/70 text-xs font-medium tracking-[0.16em] uppercase mb-4">Start today</p>
          <h2 className="font-playfair text-4xl md:text-5xl mb-5">
            Ready to eat fresher?
          </h2>
          <p className="text-cream/60 max-w-md mx-auto mb-12 font-light leading-relaxed text-base">
            Join OFS today and get organic groceries delivered right to your door —
            fast, fresh, and tracked every step of the way.
          </p>
          <Link
            href="/login-register"
            className="inline-block bg-cream text-forest font-medium px-10 py-4 rounded-full hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 transition-all duration-200 text-base shadow-xl"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-darkbg text-[#a0b8a6]/60 py-10 text-center text-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(74,124,89,0.08)_0%,transparent_60%)]" />
        <p className="relative z-10">
          © 2025{" "}
          <span className="font-playfair text-cream">OFS</span>{" "}
          — Organic Food Service, San Jose, CA. All rights reserved.
        </p>
      </footer>
    </main>
  );
}