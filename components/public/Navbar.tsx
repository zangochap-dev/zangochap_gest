"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Menu, X, Phone, Smartphone } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Fetch dynamic announcement from DB
    fetch("/api/public/cms")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content?.announcement) {
          setAnnouncement(data.content.announcement);
        }
      })
      .catch((err) => console.error("Error fetching CMS announcement:", err));

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      {announcement && (
        <div className="bg-[#1A1614] text-white text-center py-2.5 px-4 text-[11px] font-medium tracking-[0.12em] uppercase md:text-[11px] text-[9px]">
          <span>{announcement}</span>
        </div>
      )}

      <nav className={`sticky top-0 z-[1000] bg-white/96 backdrop-blur-[24px] border-b border-black/5 transition-all duration-400 ${scrolled ? "shadow-[0_1px_20px_rgba(0,0,0,0.06)]" : ""}`}>
        <div className="max-w-[1440px] mx-auto h-[64px] md:h-[80px] grid grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8 w-full">
          {/* LEFT: Mobile menu + Search */}
          <div className="flex items-center gap-2">
            <button className="md:hidden w-10 h-10 flex items-center justify-center text-[#1A1614] rounded-full hover:bg-black/5" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-[#1A1614] rounded-full hover:bg-black/5" onClick={() => setSearchOpen(!searchOpen)} aria-label="Rechercher">
              <Search size={20} />
            </button>
            <div className="hidden md:flex items-center gap-8 ml-4">
              <Link href="/shop" className="text-[#555] text-[12px] font-medium uppercase tracking-widest transition-colors hover:text-[#1A1614] relative group">
                Boutique
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#1A1614] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/#news" className="text-[#555] text-[12px] font-medium uppercase tracking-widest transition-colors hover:text-[#1A1614] relative group">
                Nouveautés
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#1A1614] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/#featured" className="text-[#555] text-[12px] font-medium uppercase tracking-widest transition-colors hover:text-[#1A1614] relative group">
                Sélection
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#1A1614] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/downloads" className="text-[#555] text-[12px] font-medium uppercase tracking-widest transition-colors hover:text-[#1A1614] relative group">
                App
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#1A1614] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </div>
          </div>

          {/* CENTER: Logo */}
          <Link href="/" className="flex justify-center items-center no-underline">
            <img src="/logo.png" alt="ZANGOCHAP" className="h-[45px] md:h-[55px] w-auto object-contain" />
          </Link>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end gap-3">
            <a href="tel:+2250757330000" className="hidden md:flex w-10 h-10 items-center justify-center text-[#1A1614] rounded-full hover:bg-black/5" aria-label="Appeler">
              <Phone size={19} />
            </a>
            <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center text-[#1A1614] rounded-full hover:bg-black/5">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-0.5 bg-[#1A1614] text-white text-[9px] font-bold w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-white leading-none">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* SEARCH OVERLAY */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 py-5 px-8 animate-[slideDown_0.25s_ease]">
            <form 
              className="max-w-[600px] mx-auto flex items-center gap-3.5 border-b-2 border-[#1A1614] pb-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = String(formData.get("search") || "");
                if (q) {
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }
              }}
            >
              <Search size={20} className="text-gray-400" />
              <input name="search" autoFocus type="text" placeholder="Que recherchez-vous ?" className="flex-1 border-none outline-none text-base text-[#1A1614] font-light tracking-wide" />
              <button type="button" className="bg-none border-none cursor-pointer text-gray-400" onClick={() => setSearchOpen(false)}><X size={20} /></button>
            </form>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="fixed inset-0 top-[64px] bg-black/30 z-[999] animate-fade-in" onClick={() => setMobileOpen(false)}>
            <div className="bg-white w-[300px] h-full flex flex-col p-10 gap-0 animate-[slideInLeft_0.3s_ease]" onClick={e => e.stopPropagation()}>
              <Link href="/shop" className="no-underline text-[#1A1614] text-base font-normal py-4 border-b border-gray-100 tracking-wider transition-all hover:pl-2" onClick={() => setMobileOpen(false)}>Boutique</Link>
              <Link href="/#news" className="no-underline text-[#1A1614] text-base font-normal py-4 border-b border-gray-100 tracking-wider transition-all hover:pl-2" onClick={() => setMobileOpen(false)}>Nouveautés</Link>
              <Link href="/#featured" className="no-underline text-[#1A1614] text-base font-normal py-4 border-b border-gray-100 tracking-wider transition-all hover:pl-2" onClick={() => setMobileOpen(false)}>Sélection</Link>
              <Link href="/downloads" className="no-underline text-[#1A1614] text-base font-normal py-4 border-b border-gray-100 tracking-wider transition-all hover:pl-2 flex items-center gap-2" onClick={() => setMobileOpen(false)}><Smartphone size={17} /> Application</Link>
              <Link href="/cart" className="no-underline text-[#1A1614] text-base font-normal py-4 border-b border-gray-100 tracking-wider transition-all hover:pl-2" onClick={() => setMobileOpen(false)}>Mon Panier ({itemCount})</Link>
              <div className="mt-auto pt-8">
                <a href="tel:+2250757330000" className="flex items-center gap-2.5 no-underline text-gray-400 text-[13px]"><Phone size={16} /> Service Client</a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
