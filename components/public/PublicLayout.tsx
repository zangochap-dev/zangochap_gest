"use client";

import React from "react";
import Navbar from "@/components/public/Navbar";
import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="public-site">
      <Navbar />
      <main>{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        <Link href="/" className="nav-item-mobile active">
          <Home size={20} strokeWidth={1.5} />
          <span>ACCUEIL</span>
        </Link>
        <Link href="/shop" className="nav-item-mobile">
          <Search size={20} strokeWidth={1.5} />
          <span>SHOP</span>
        </Link>
        <Link href="/cart" className="nav-item-mobile">
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={20} strokeWidth={1.5} />
            {itemCount > 0 && <span className="cart-badge-mobile">{itemCount}</span>}
          </div>
          <span>PANIER</span>
        </Link>
        <Link href="/compte" className="nav-item-mobile">
          <User size={20} strokeWidth={1.5} />
          <span>COMPTE</span>
        </Link>
      </div>

      {/* NEWSLETTER + FOOTER */}
      <footer className="pub-footer">
        {/* Newsletter Section */}
        <div className="newsletter-section">
          <div className="newsletter-inner">
            <h3>RESTEZ CONNECTÉ</h3>
            <p>Recevez en avant-première nos nouvelles collections et offres exclusives.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Votre adresse email" />
              <button type="submit">S'INSCRIRE</button>
            </form>
          </div>
        </div>

        {/* Footer Main */}
        <div className="footer-main">
          <div className="footer-grid">
            <div className="footer-col brand-col">
              <div className="footer-logo">ZANGOCHAP</div>
              <p className="footer-tagline">Maison de mode contemporaine. Des pièces intemporelles conçues avec exigence pour ceux qui refusent l'ordinaire.</p>
              <div className="social-links">
                <a href="#" aria-label="Instagram">IG</a>
                <a href="#" aria-label="Facebook">FB</a>
                <a href="#" aria-label="TikTok">TK</a>
              </div>
            </div>

            <div className="footer-col">
              <h4>BOUTIQUE</h4>
              <ul>
                <li><a href="/shop">Nouvelle Collection</a></li>
                <li><a href="/#featured">Sélection</a></li>
                <li><a href="#">Accessoires</a></li>
                <li><a href="#">Éditions Limitées</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>AIDE</h4>
              <ul>
                <li><a href="#">Service Client</a></li>
                <li><a href="#">Livraison & Retours</a></li>
                <li><a href="#">Guide des Tailles</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>CONTACT</h4>
              <ul>
                <li><a href="tel:+22500000000">+225 00 00 00 00</a></li>
                <li><a href="mailto:contact@zangochap.ci">contact@zangochap.ci</a></li>
                <li><span className="footer-hours">Lun-Sam · 9h-19h</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Zangochap. Tous droits réservés.</span>
          <div className="footer-legal">
            <a href="#">Politique de Confidentialité</a>
            <a href="#">Conditions Générales</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .public-site {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
        }
        main { flex: 1; }

        /* MOBILE BOTTOM NAV */
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0; right: 0;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0,0,0,0.06);
          z-index: 900;
          padding: 6px 0 env(safe-area-inset-bottom, 8px);
        }
        .cart-badge-mobile {
          position: absolute;
          top: -4px; right: -7px;
          background: #1A1614;
          color: white;
          font-size: 8px;
          width: 15px; height: 15px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          border: 2px solid white;
        }

        /* NEWSLETTER */
        .newsletter-section {
          background: #F7F5F0;
          padding: 80px 32px;
          text-align: center;
        }
        .newsletter-inner {
          max-width: 520px;
          margin: 0 auto;
        }
        .newsletter-inner h3 {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.35em;
          color: #1A1614;
          margin-bottom: 14px;
        }
        .newsletter-inner p {
          font-size: 14px;
          color: #888;
          line-height: 1.7;
          margin-bottom: 32px;
        }
        .newsletter-form {
          display: flex;
          gap: 0;
          border: 1px solid #D5D0C8;
          overflow: hidden;
        }
        .newsletter-form input {
          flex: 1;
          padding: 16px 20px;
          border: none;
          outline: none;
          font-size: 13px;
          background: transparent;
          color: #1A1614;
          letter-spacing: 0.02em;
        }
        .newsletter-form button {
          padding: 16px 32px;
          background: #1A1614;
          color: white;
          border: none;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: background 0.3s;
          white-space: nowrap;
        }
        .newsletter-form button:hover { background: #333; }

        /* FOOTER MAIN */
        .pub-footer {
          margin-top: auto;
        }
        .footer-main {
          background: #1A1614;
          color: white;
          padding: 70px 32px 50px;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
        }
        .footer-logo {
          font-size: 20px;
          font-weight: 300;
          letter-spacing: 0.35em;
          margin-bottom: 20px;
        }
        .footer-tagline {
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255,255,255,0.45);
          margin-bottom: 24px;
        }
        .social-links {
          display: flex;
          gap: 12px;
        }
        .social-links a {
          width: 36px; height: 36px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          transition: all 0.3s;
        }
        .social-links a:hover {
          border-color: rgba(255,255,255,0.4);
          color: white;
        }
        .footer-col h4 {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.35);
          margin-bottom: 24px;
        }
        .footer-col ul {
          list-style: none;
          padding: 0; margin: 0;
        }
        .footer-col li {
          margin-bottom: 14px;
        }
        .footer-col a {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .footer-col a:hover { color: white; }
        .footer-hours {
          color: rgba(255,255,255,0.35);
          font-size: 12px;
        }

        /* FOOTER BOTTOM */
        .footer-bottom {
          background: #151210;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 100%;
        }
        .footer-bottom span {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.04em;
        }
        .footer-legal {
          display: flex;
          gap: 24px;
        }
        .footer-legal a {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal a:hover { color: rgba(255,255,255,0.6); }

        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex; justify-content: space-around; }
          .pub-footer { padding-bottom: 80px; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px 30px; }
          .brand-col { grid-column: 1 / -1; }
          .newsletter-section { padding: 50px 20px; }
          .newsletter-form { flex-direction: column; }
          .newsletter-form button { padding: 14px; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>
    </div>
  );
}
