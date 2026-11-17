"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ChevronDown, Menu, X } from "lucide-react";
import { EliteLogo } from "./EliteLogo";
import { SearchBar } from "./SearchBar";
import { CartIcon } from "./CartIcon";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Games", href: "/games" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Gaming Gift Cards", href: "/gaming-gift-cards" },
  { label: "Deals", href: "/deals", accent: true },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#111118]/95 backdrop-blur-md border-b border-[#2a2a3a]">
      {/* Main header row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex items-center gap-4 lg:gap-8 h-16 lg:h-18">
          {/* Logo */}
          <EliteLogo className="flex-shrink-0" size="md" />

          {/* Search bar — desktop */}
          <SearchBar className="hidden md:flex flex-1 max-w-2xl" />

          {/* Right controls */}
          <div className="flex items-center gap-1 ml-auto lg:ml-0 flex-shrink-0">
            {/* Currency / Language */}
            <button
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm text-[#9ca3af] hover:text-white hover:bg-[#1c1c26] rounded-lg transition-all"
              aria-label="Change currency and language"
            >
              <span className="text-base" aria-hidden="true">🇺🇸</span>
              <span className="text-sm font-medium">USD · EN</span>
              <ChevronDown size={13} />
            </button>

            {/* Cart */}
            <CartIcon />

            {/* Language globe — mobile */}
            <button
              className="flex lg:hidden items-center justify-center w-10 h-10 text-[#9ca3af] hover:text-white hover:bg-[#1c1c26] rounded-lg transition-all"
              aria-label="Language and region"
            >
              <Globe size={18} />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="flex md:hidden items-center justify-center w-10 h-10 text-[#9ca3af] hover:text-white hover:bg-[#1c1c26] rounded-lg transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar — tablet (shows below header row) */}
        <div className="md:hidden pb-3">
          <SearchBar compact />
        </div>
      </div>

      {/* Secondary navigation — desktop */}
      <nav
        className="hidden md:block border-t border-[#1e1e2a] bg-[#0e0e18]"
        aria-label="Main navigation"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
          <ul className="flex items-center gap-0 h-11" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded transition-colors nav-link",
                    link.accent
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-[#9ca3af] hover:text-white"
                  )}
                >
                  {link.label}
                  {(link.label === "Games" ||
                    link.label === "Gift Cards" ||
                    link.label === "Gaming Gift Cards" ||
                    link.label === "Subscriptions") && (
                    <ChevronDown size={12} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#2a2a3a] bg-[#111118]">
          <nav aria-label="Mobile navigation">
            <ul className="py-2" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center px-6 py-3 text-sm font-medium transition-colors",
                      link.accent
                        ? "text-blue-400"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#1c1c26]"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#2a2a3a] px-6 py-4 flex items-center gap-3">
              <span className="text-base">🇺🇸</span>
              <span className="text-sm text-[#9ca3af]">USD · English</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
