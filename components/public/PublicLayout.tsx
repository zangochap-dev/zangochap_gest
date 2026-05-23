"use client";

import React from "react";
import Navbar from "@/components/public/Navbar";
import PublicPopupLoader from "@/components/public/PublicPopupLoader";
import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white w-full overflow-x-clip font-body">
      <Navbar />
      <PublicPopupLoader />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/96 backdrop-blur-[20px] border-t border-black/5 z-[900] flex justify-around p-1.5 pb-[env(safe-area-inset-bottom,8px)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#1A1614] no-underline">
          <Home size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-widest uppercase">ACCUEIL</span>
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-1 text-[#666] no-underline">
          <Search size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-widest uppercase">SHOP</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-[#666] no-underline">
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-[#1A1614] text-white text-[8px] w-[15px] h-[15px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase">PANIER</span>
        </Link>
        <Link href="/compte" className="flex flex-col items-center gap-1 text-[#666] no-underline">
          <User size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-bold tracking-widest uppercase">COMPTE</span>
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto md:pb-0 pb-20 w-full">
        {/* Newsletter Section */}
        <div className="bg-[#F7F5F0] py-20 px-6 text-center w-full">
          <div className="max-w-[520px] mx-auto">
            <h3 className="text-[13px] font-normal tracking-[0.35em] text-[#1A1614] mb-3.5 uppercase">RESTEZ CONNECTÉ</h3>
            <p className="text-sm text-[#888] leading-relaxed mb-8">Recevez en avant-première nos nouvelles collections et offres exclusives.</p>
            <form className="flex flex-col sm:flex-row border border-[#D5D0C8] overflow-hidden" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                className="flex-1 p-4 outline-none text-[13px] bg-transparent text-[#1A1614] tracking-wide"
              />
              <button 
                type="submit" 
                className="p-4 bg-[#1A1614] text-white text-[11px] font-semibold tracking-[0.15em] cursor-pointer transition-colors hover:bg-[#333] whitespace-nowrap uppercase"
              >
                S'INSCRIRE
              </button>
            </form>
          </div>
        </div>

        {/* Footer Main */}
        <div className="bg-[#1A1614] text-white py-[70px] pb-[50px] px-6 w-full">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 md:gap-[60px]">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <img src="/logo.png" alt="ZANGOCHAP" className="h-[40px] w-auto mb-6 brightness-0 invert" />
              <p className="text-[13px] leading-relaxed text-white/45 mb-6">Zangochap : Mieux s'habiller à prix bas ! Nous offrons une sélection exceptionnelle de produits de qualité avec un service client réactif et des livraisons rapides.</p>
              <div className="flex gap-3">
                <a href="https://instagram.com/zangochap" target="_blank" className="w-9 h-9 border border-white/15 rounded-full flex items-center justify-center text-white/50 text-[10px] font-bold tracking-wider no-underline transition-all hover:border-white/40 hover:text-white">IG</a>
                <a href="https://facebook.com/zangochap" target="_blank" className="w-9 h-9 border border-white/15 rounded-full flex items-center justify-center text-white/50 text-[10px] font-bold tracking-wider no-underline transition-all hover:border-white/40 hover:text-white">FB</a>
                <a href="#" className="w-9 h-9 border border-white/15 rounded-full flex items-center justify-center text-white/50 text-[10px] font-bold tracking-wider no-underline transition-all hover:border-white/40 hover:text-white">TK</a>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-medium tracking-[0.2em] text-white/35 mb-6 uppercase">BOUTIQUE</h4>
              <ul className="list-none p-0 m-0 space-y-3.5">
                <li><Link href="/shop" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Nouvelle Collection</Link></li>
                <li><Link href="/#featured" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Sélection</Link></li>
                <li><Link href="/shop?category=Accessoires" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Accessoires</Link></li>
                <li><Link href="#" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Éditions Limitées</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-medium tracking-[0.2em] text-white/35 mb-6 uppercase">AIDE</h4>
              <ul className="list-none p-0 m-0 space-y-3.5">
                <li><Link href="#" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Service Client</Link></li>
                <li><Link href="#" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Livraison & Retours</Link></li>
                <li><Link href="#" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">Guide des Tailles</Link></li>
                <li><Link href="#" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-medium tracking-[0.2em] text-white/35 mb-6 uppercase">CONTACT</h4>
              <ul className="list-none p-0 m-0 space-y-3.5">
                <li><a href="tel:+2250757330000" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">+225 07 57 33 00 00</a></li>
                <li><a href="mailto:service@zangochap.ci" className="text-white/65 no-underline text-[13px] tracking-wide transition-colors hover:text-white">service@zangochap.ci</a></li>
                <li><span className="text-white/35 text-[12px]">Lun-Sam · 8h30-17h</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="bg-[#151210] py-6 px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center w-full">
          <span className="text-[11px] text-white/25 tracking-wide">&copy; {new Date().getFullYear()} Zangochap. Tous droits réservés.</span>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[11px] text-white/25 no-underline transition-colors hover:text-white/60">Politique de Confidentialité</Link>
            <Link href="#" className="text-[11px] text-white/25 no-underline transition-colors hover:text-white/60">Conditions Générales</Link>
            <Link 
              href="/zangochap-manager" 
              className="text-[11px] text-white/20 no-underline transition-all hover:text-[#FF6B2C] flex items-center gap-1.5 px-3 py-1 border border-white/5 rounded-full hover:border-[#FF6B2C]/30"
            >
              <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#FF6B2C]" />
              Accès Manager
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
