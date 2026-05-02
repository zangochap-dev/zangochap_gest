"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";
import {
  LayoutDashboard, ShoppingBag, Package, Truck, Box, Users, BarChart3,
  Tag, Upload, FileText, LogOut, Menu, X, ClipboardList,
  AlertTriangle, Settings, MapPin, Store, ChevronRight, History, Wallet, Warehouse,
  User
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    initials: string;
  };
  counts?: {
    orders?: number;
    packing?: number;
    collection?: number;
    toProcess?: number;
  };
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

// ============ ORGANIZED NAV BY ROLE (with sections) ============

const NAV_FOR_ROLE: Record<string, (counts?: any) => NavSection[]> = {

  commercial: (counts) => [
    {
      items: [
        { label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Commandes',
      items: [
        { label: 'Toutes les commandes', href: '/zangochap-manager/orders', icon: <ShoppingBag size={18} />, badge: counts?.orders },
        { label: 'À traiter (site)', href: '/zangochap-manager/orders/to-process', icon: <AlertTriangle size={18} />, badge: counts?.toProcess },
        { label: 'Non emballées', href: '/zangochap-manager/orders/non-packed', icon: <Package size={18} /> },
        { label: 'Nouvelle commande', href: '/zangochap-manager/orders/new', icon: <ClipboardList size={18} /> },
      ]
    },
    {
      title: 'Clients',
      items: [
        { label: 'CRM Clients', href: '/zangochap-manager/admin/crm', icon: <Users size={18} /> },
      ]
    },
  ],

  packing: (counts) => [
    {
      items: [
        { label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Logistique',
      items: [
        { label: 'Emballage', href: '/zangochap-manager/logistics/packing', icon: <Package size={18} />, badge: counts?.packing },
        { label: 'Fiche vérification', href: '/zangochap-manager/logistics/verification', icon: <FileText size={18} /> },
      ]
    },
    {
      title: 'Produits',
      items: [
        { label: 'Ajouter un produit', href: '/zangochap-manager/products/new', icon: <ClipboardList size={18} /> },
      ]
    },
  ],

  collection: (counts) => [
    {
      items: [
        { label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Logistique',
      items: [
        { label: 'Collecte', href: '/zangochap-manager/logistics/collection', icon: <Truck size={18} />, badge: counts?.collection },
      ]
    },
  ],

  stock: (counts) => [
    {
      items: [
        { label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Inventaire',
      items: [
        { label: 'Tous les produits', href: '/zangochap-manager/products', icon: <Box size={18} /> },
        { label: 'Ruptures de stock', href: '/zangochap-manager/products/shortages', icon: <AlertTriangle size={18} /> },
        { label: 'Historique stock', href: '/zangochap-manager/inventory/history', icon: <History size={18} /> },
        { label: 'Entrepôts', href: '/zangochap-manager/logistics/warehouses', icon: <Warehouse size={18} /> },
        { label: 'Ajouter un produit', href: '/zangochap-manager/products/new', icon: <ClipboardList size={18} /> },
      ]
    },
  ],

  admin: (counts) => [
    {
      items: [
        { label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Commandes',
      items: [
        { label: 'Toutes les commandes', href: '/zangochap-manager/orders', icon: <ShoppingBag size={18} />, badge: counts?.orders },
        { label: 'À traiter (site)', href: '/zangochap-manager/orders/to-process', icon: <AlertTriangle size={18} />, badge: counts?.toProcess },
        { label: 'Non emballées', href: '/zangochap-manager/orders/non-packed', icon: <Package size={18} /> },
      ]
    },
    {
      title: 'Logistique',
      items: [
        { label: 'Emballage', href: '/zangochap-manager/logistics/packing', icon: <Package size={18} />, badge: counts?.packing },
        { label: 'Collecte', href: '/zangochap-manager/logistics/collection', icon: <Truck size={18} />, badge: counts?.collection },
        { label: 'Fiche vérification', href: '/zangochap-manager/logistics/verification', icon: <FileText size={18} /> },
        { label: 'Fiche livreurs', href: '/zangochap-manager/admin/delivery-sheet', icon: <FileText size={18} /> },
        { label: 'Entrepôts', href: '/zangochap-manager/logistics/warehouses', icon: <Warehouse size={18} /> },
        { label: 'Règlement livreurs', href: '/zangochap-manager/admin/delivery/settlement', icon: <Wallet size={18} /> },
      ]
    },
    {
      title: 'Inventaire',
      items: [
        { label: 'Tous les produits', href: '/zangochap-manager/products', icon: <Box size={18} /> },
        { label: 'Ruptures de stock', href: '/zangochap-manager/products/shortages', icon: <AlertTriangle size={18} /> },
        { label: 'Historique stock', href: '/zangochap-manager/inventory/history', icon: <History size={18} /> },
      ]
    },
    {
      title: 'Analyse',
      items: [
        { label: 'Rapports règlements', href: '/zangochap-manager/admin/settlements', icon: <Wallet size={18} /> },
        { label: 'Performance équipe', href: '/zangochap-manager/admin/performance', icon: <BarChart3 size={18} /> },
        { label: 'Top produits', href: '/zangochap-manager/admin/top-products', icon: <BarChart3 size={18} /> },
        { label: 'CRM Clients', href: '/zangochap-manager/admin/crm', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Attribution livraisons', href: '/zangochap-manager/admin/delivery', icon: <Truck size={18} /> },
        { label: 'Accès Rider', href: '/zangochap-rider', icon: <User size={18} /> },
        { label: 'Configuration', href: '/zangochap-manager/admin/settings', icon: <Settings size={18} /> },
        { label: 'Importer données', href: '/zangochap-manager/admin/import', icon: <Upload size={18} /> },
      ]
    },
  ],

  livreur: (counts) => [
    {
      items: [
        { label: 'Mes Livraisons', href: '/zangochap-rider', icon: <Truck size={18} />, badge: counts?.myDeliveries },
        { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
  ],
};

export default function Sidebar({ user, counts }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const getSections = NAV_FOR_ROLE[user.role] || NAV_FOR_ROLE.admin;
  const sections = getSections(counts);
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* LOGO */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot" />
          <div>
            <div className="sidebar-logo-text">ZANGOCHAP</div>
            <div className="sidebar-logo-sub">Back Office</div>
          </div>
        </div>

        {/* NAV WITH SECTIONS */}
        <nav className="sidebar-nav">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="sidebar-section">
              {section.title && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map(item => {
                const isActive = pathname === item.href ||
                  (item.href !== '/zangochap-manager/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="sidebar-link-inner">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* BOUTIQUE LINK */}
        <div className="sidebar-shop-link">
          <Link href="/" className="shop-link-btn" target="_blank">
            <Store size={16} />
            <span>Voir la boutique</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* USER / LOGOUT */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="sidebar-role-badge">{roleLabel}</div>
              </div>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="sidebar-logout">
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-mobile-toggle {
          display: none;
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 60;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          background: #1A1614;
          color: white;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          border: none;
          cursor: pointer;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 40;
          backdrop-filter: blur(4px);
        }
        .sidebar {
          width: var(--sidebar-w);
          background: #1A1614;
          color: white;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          overflow-y: auto;
          z-index: 50;
          border-right: 1px solid rgba(255,255,255,0.03);
        }
        /* Scrollbar */
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .sidebar-logo {
          padding: 24px 20px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sidebar-logo-dot {
          width: 32px;
          height: 32px;
          background: #D4541C;
          border-radius: 6px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(212, 84, 28, 0.3);
        }
        .sidebar-logo-text {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #FFFFFF;
        }
        .sidebar-logo-sub {
          font-size: 10px;
          opacity: 0.4;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: -2px;
        }

        /* SECTIONS */
        .sidebar-nav {
          flex: 1;
          padding: 0 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-section {
          margin-bottom: 4px;
        }
        .sidebar-section-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.25);
          padding: 16px 14px 6px;
          margin-top: 4px;
        }

        /* LINKS */
        :global(.sidebar-link) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          margin-bottom: 1px;
        }
        .sidebar-link-inner {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        :global(.sidebar-link:hover) {
          background: rgba(255,255,255,0.06);
          color: white;
        }
        :global(.sidebar-link.active) {
          background: #D4541C;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(212, 84, 28, 0.25);
        }
        :global(.sidebar-link.active .sidebar-badge) {
          background: rgba(255,255,255,0.25);
          color: white;
        }
        .sidebar-badge {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.9);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
          min-width: 22px;
          text-align: center;
        }

        /* SHOP LINK */
        .sidebar-shop-link {
          padding: 8px 12px;
        }
        :global(.shop-link-btn) {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          border: 1px dashed rgba(255,255,255,0.1);
          transition: all 0.2s;
        }
        :global(.shop-link-btn span) { flex: 1; }
        :global(.shop-link-btn:hover) {
          border-color: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.03);
        }

        /* FOOTER */
        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.15);
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px;
          margin-bottom: 12px;
        }
        .sidebar-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #D4541C 0%, #B44415 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          color: white;
        }
        .sidebar-user-info { flex: 1; min-width: 0; }
        .sidebar-user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white; margin-bottom: 3px; }
        .sidebar-role-badge {
          background: rgba(212, 84, 28, 0.2);
          color: #F0915A;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
          letter-spacing: 0.04em;
          line-height: 1;
          text-transform: uppercase;
        }
        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sidebar-logout:hover { background: rgba(199,62,29,0.15); color: #FF4D4D; }

        @media (max-width: 768px) {
          .sidebar-mobile-toggle { display: flex; }
          .sidebar-overlay { display: block; }
          .sidebar {
            position: fixed;
            left: -260px;
            top: 0;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 20px 0 40px rgba(0,0,0,0.3);
          }
          .sidebar.open { left: 0; }
        }
      `}</style>
    </>
  );
}
