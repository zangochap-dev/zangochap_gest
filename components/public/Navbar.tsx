"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Menu, X, Phone, Heart, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement-bar">
        <span>LIVRAISON OFFERTE À ABIDJAN · CODE <strong>ZANGO10</strong> : -10% SUR VOTRE 1ÈRE COMMANDE</span>
      </div>

      <nav className={`pub-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          {/* LEFT: Mobile menu + Search */}
          <div className="nav-left">
            <button className="nav-icon-btn mobile-only" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button className="nav-icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Rechercher">
              <Search size={20} />
            </button>
            <div className="nav-links desktop-only">
              <Link href="/shop">Boutique</Link>
              <Link href="/#news">Nouveautés</Link>
              <Link href="/#featured">Sélection</Link>
            </div>
          </div>

          {/* CENTER: Logo */}
          <Link href="/" className="nav-brand">
            <span className="brand-name">ZANGOCHAP</span>
          </Link>

          {/* RIGHT: Actions */}
          <div className="nav-right">
            <a href="tel:+22500000000" className="nav-icon-btn desktop-only" aria-label="Appeler">
              <Phone size={19} />
            </a>
            <Link href="/cart" className="nav-icon-btn cart-icon-wrap">
              <ShoppingBag size={20} />
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </Link>
          </div>
        </div>

        {/* SEARCH OVERLAY */}
        {searchOpen && (
          <div className="search-overlay">
            <form 
              className="search-inner"
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.target as any).search.value;
                if (q) {
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }
              }}
            >
              <Search size={20} color="#999" />
              <input name="search" autoFocus type="text" placeholder="Que recherchez-vous ?" />
              <button type="button" className="close-search" onClick={() => setSearchOpen(false)}><X size={20} /></button>
            </form>
          </div>
        )}

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="mobile-menu-overlay">
            <div className="mobile-menu-panel">
              <Link href="/shop" onClick={() => setMobileOpen(false)}>Boutique</Link>
              <Link href="/#news" onClick={() => setMobileOpen(false)}>Nouveautés</Link>
              <Link href="/#featured" onClick={() => setMobileOpen(false)}>Sélection</Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)}>Mon Panier ({itemCount})</Link>
              <div className="mobile-menu-footer">
                <a href="tel:+22500000000"><Phone size={16} /> Service Client</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style jsx>{`
        /* ANNOUNCEMENT */
        .announcement-bar {
          background: #1A1614;
          color: white;
          text-align: center;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .announcement-bar strong { color: #E8C07A; }

        /* NAV */
        .pub-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.4s ease, padding 0.4s ease;
        }
        .nav-scrolled {
          box-shadow: 0 1px 20px rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1440px;
          margin: 0 auto;
          height: 80px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 32px;
        }

        /* LEFT */
        .nav-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-left: 16px;
        }
        .nav-links :global(a) {
          text-decoration: none;
          color: #555;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s;
          position: relative;
        }
        .nav-links :global(a::after) {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: #1A1614;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-links :global(a:hover) { color: #1A1614; }
        .nav-links :global(a:hover::after) { width: 100%; }

        /* BRAND */
        .nav-brand {
          text-decoration: none;
          text-align: center;
        }
        .brand-name {
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.35em;
          color: #1A1614;
          font-family: inherit;
        }

        /* RIGHT */
        .nav-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        /* ICON BTN */
        .nav-icon-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #1A1614;
          border-radius: 50%;
          transition: background 0.2s;
          text-decoration: none;
        }
        .nav-icon-btn:hover { background: rgba(0,0,0,0.04); }

        /* CART BADGE */
        .cart-icon-wrap { position: relative; }
        .cart-count {
          position: absolute;
          top: 4px; right: 2px;
          background: #1A1614;
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 17px; height: 17px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          line-height: 1;
        }

        /* SEARCH OVERLAY */
        .search-overlay {
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          background: white;
          border-bottom: 1px solid #eee;
          padding: 20px 32px;
          animation: slideDown 0.25s ease;
        }
        .search-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 2px solid #1A1614;
          padding-bottom: 12px;
        }
        .search-inner input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #1A1614;
          font-weight: 300;
          letter-spacing: 0.02em;
        }
        .close-search {
          background: none; border: none; cursor: pointer; color: #999;
        }

        /* MOBILE MENU */
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          top: 64px;
          background: rgba(0,0,0,0.3);
          z-index: 999;
          animation: fadeInBg 0.3s ease;
        }
        .mobile-menu-panel {
          background: white;
          width: 300px;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 40px 32px;
          gap: 0;
          animation: slideInLeft 0.3s ease;
        }
        .mobile-menu-panel :global(a) {
          text-decoration: none;
          color: #1A1614;
          font-size: 16px;
          font-weight: 400;
          padding: 18px 0;
          border-bottom: 1px solid #f0f0f0;
          letter-spacing: 0.04em;
          transition: padding-left 0.2s;
        }
        .mobile-menu-panel :global(a:hover) { padding-left: 8px; }
        .mobile-menu-footer {
          margin-top: auto;
          padding-top: 30px;
        }
        .mobile-menu-footer a {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #888;
          font-size: 13px;
        }

        /* RESPONSIVE */
        .mobile-only { display: none; }
        .desktop-only { display: flex; }

        @media (max-width: 768px) {
          .nav-inner { padding: 0 16px; height: 56px; }
          .brand-name { font-size: 18px; letter-spacing: 0.25em; }
          .mobile-only { display: flex; }
          .desktop-only { display: none; }
          .announcement-bar { font-size: 9px; letter-spacing: 0.08em; padding: 8px 12px; }
        }

        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
