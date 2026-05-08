"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { logoutAction } from "@/modules/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";
import {
  LayoutDashboard, ShoppingBag, Package, Truck, Box, Users, BarChart3,
  Tag, Upload, FileText, LogOut, Menu, X, ClipboardList,
  AlertTriangle, Settings, MapPin, Store, ChevronRight, History, Wallet, Warehouse,
  User, ExternalLink
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
    myDeliveries?: number;
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

// ============ ORGANIZED NAV BY ROLE ============

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
        { label: 'Tableau de bord', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Répertoire interne', href: '/zangochap-manager/directory', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Ventes & Clients',
      items: [
        { label: 'Toutes les commandes', href: '/zangochap-manager/orders', icon: <ShoppingBag size={18} />, badge: counts?.orders },
        { label: 'À traiter (site)', href: '/zangochap-manager/orders/to-process', icon: <AlertTriangle size={18} />, badge: counts?.toProcess },
        { label: 'CRM Clients', href: '/zangochap-manager/admin/crm', icon: <Users size={18} /> },
      ]
    },
    {
      title: 'Logistique & Livraisons',
      items: [
        { label: 'Attribution livraisons', href: '/zangochap-manager/admin/delivery', icon: <Truck size={18} /> },
        { label: 'Fiche livreurs', href: '/zangochap-manager/admin/delivery-sheet', icon: <FileText size={18} /> },
        { label: 'Règlement livreurs', href: '/zangochap-manager/admin/delivery/settlement', icon: <Wallet size={18} /> },
      ]
    },
    {
      title: 'Opérations Entrepôt',
      items: [
        { label: 'Emballage', href: '/zangochap-manager/logistics/packing', icon: <Package size={18} />, badge: counts?.packing },
        { label: 'Collecte', href: '/zangochap-manager/logistics/collection', icon: <Truck size={18} />, badge: counts?.collection },
        { label: 'Fiche vérification', href: '/zangochap-manager/logistics/verification', icon: <FileText size={18} /> },
        { label: 'Gestion Entrepôts', href: '/zangochap-manager/logistics/warehouses', icon: <Warehouse size={18} /> },
      ]
    },
    {
      title: 'Catalogue & Stock',
      items: [
        { label: 'Tous les produits', href: '/zangochap-manager/products', icon: <Box size={18} /> },
        { label: 'Ruptures de stock', href: '/zangochap-manager/products/shortages', icon: <AlertTriangle size={18} /> },
        { label: 'Historique stock', href: '/zangochap-manager/inventory/history', icon: <History size={18} /> },
        { label: 'Ajouter un produit', href: '/zangochap-manager/products/new', icon: <ClipboardList size={18} /> },
      ]
    },
    {
      title: 'Pilotage & Système',
      items: [
        { label: 'Rapports règlements', href: '/zangochap-manager/admin/settlements', icon: <Wallet size={18} /> },
        { label: 'Performance équipe', href: '/zangochap-manager/admin/performance', icon: <BarChart3 size={18} /> },
        { label: 'Top produits', href: '/zangochap-manager/admin/top-products', icon: <BarChart3 size={18} /> },
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
  const [scrolled, setScrolled] = useState(false);

  const getSections = NAV_FOR_ROLE[user.role] || NAV_FOR_ROLE.admin;
  const sections = getSections(counts);
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  useEffect(() => {
    const nav = document.querySelector('.sidebar-nav');
    const handleScroll = () => setScrolled((nav?.scrollTop || 0) > 10);
    nav?.addEventListener('scroll', handleScroll);
    return () => nav?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Mobile Toggle */}
      <motion.button
        initial={false}
        animate={{ backgroundColor: mobileOpen ? "#FF6B2C" : "#0F1115" }}
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        <AnimatePresence mode="wait">
          {mobileOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Menu size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* LOGO */}
        <div className={`sidebar-header ${scrolled ? 'is-scrolled' : ''}`}>
          <div className="sidebar-logo">
            <Image 
              src="/logo.png" 
              alt="ZANGOCHAP" 
              width={160} 
              height={45} 
              className="logo-img"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        {/* NAV WITH SECTIONS */}
        <nav className="sidebar-nav">
          <div className="nav-container">
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
                        <span className="icon-wrapper">
                          {item.icon}
                        </span>
                        <span className="label-text">{item.label}</span>
                      </div>
                      
                      {isActive && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="active-indicator"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      {item.badge !== undefined && item.badge > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }}
                          className="sidebar-badge"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* SHOP LINK */}
        <div className="sidebar-extra">
          <Link href="/" className="shop-link-btn" target="_blank">
            <div className="shop-link-icon">
              <Store size={14} />
            </div>
            <span>Boutique</span>
            <ExternalLink size={12} className="external-icon" />
          </Link>
        </div>

        {/* USER / LOGOUT */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.initials}
                <div className="online-indicator" />
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-role-badge">{roleLabel}</div>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="sidebar-logout" title="Déconnexion">
                <LogOut size={14} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-mobile-toggle {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 100;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          color: white;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 80;
          backdrop-filter: blur(12px);
        }
        .sidebar {
          width: var(--sidebar-w);
          background: #0F1115;
          color: white;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          z-index: 90;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-header {
          padding: 32px 24px 20px;
          transition: all 0.3s;
          border-bottom: 1px solid transparent;
        }
        .sidebar-header.is-scrolled {
          background: rgba(15, 17, 21, 0.8);
          backdrop-filter: blur(10px);
          border-bottom-color: rgba(255,255,255,0.05);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sidebar-logo-dot {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #FF6B2C 0%, #E65A1F 100%);
          border-radius: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(255, 107, 44, 0.3);
        }
        .inner-dot {
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 4px;
        }
        .sidebar-logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.01em;
          color: #FFFFFF;
          line-height: 1;
        }
        .sidebar-logo-sub {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.3;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 4px;
        }

        /* NAV */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
          padding: 8px 0;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }
        
        .nav-container {
          padding: 0 16px;
          padding-bottom: 32px;
        }

        .sidebar-section {
          margin-bottom: 24px;
        }
        .sidebar-section-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.25);
          padding: 0 12px 12px;
        }

        /* LINKS */
        :global(.sidebar-link) {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          margin-bottom: 2px;
          overflow: hidden;
        }
        .sidebar-link-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2;
        }
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          opacity: 0.5;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .label-text { transition: transform 0.3s; }

        :global(.sidebar-link:hover) {
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.8);
        }
        :global(.sidebar-link:hover .icon-wrapper) {
          opacity: 1;
          transform: scale(1.1);
          color: #FF6B2C;
        }
        :global(.sidebar-link:hover .label-text) {
          transform: translateX(2px);
        }

        :global(.sidebar-link.active) {
          color: #FF6B2C;
          background: rgba(255, 107, 44, 0.08);
          font-weight: 700;
        }
        :global(.sidebar-link.active .icon-wrapper) {
          opacity: 1;
          color: #FF6B2C;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #FF6B2C;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 15px rgba(255, 107, 44, 0.5);
          z-index: 1;
        }

        .sidebar-badge {
          position: relative;
          z-index: 2;
          background: #FF6B2C;
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 6px;
          min-width: 18px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(255, 107, 44, 0.4);
        }

        /* EXTRA SECTION */
        .sidebar-extra {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.03);
        }
        :global(.shop-link-btn) {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .shop-link-icon {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        }
        :global(.shop-link-btn span) { flex: 1; }
        :global(.shop-link-btn:hover) {
          border-color: rgba(255,255,255,0.15);
          color: white;
          background: rgba(255,255,255,0.05);
        }
        :global(.shop-link-btn:hover .shop-link-icon) {
          background: #FF6B2C;
          color: white;
          box-shadow: 0 4px 10px rgba(255, 107, 44, 0.3);
        }
        .external-icon { opacity: 0.3; }

        /* FOOTER */
        .sidebar-footer {
          padding: 16px;
          background: linear-gradient(to top, #0F1115 80%, transparent);
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 10px;
          border-radius: 16px;
          transition: all 0.3s;
        }
        .user-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .sidebar-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #FF6B2C 0%, #D4541C 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
          color: white;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .online-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #34C759;
          border: 2px solid #0F1115;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(52, 199, 89, 0.5);
        }
        .sidebar-user-info { flex: 1; min-width: 0; }
        .sidebar-user-name { 
          font-size: 13px; 
          font-weight: 700; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          color: white;
        }
        .sidebar-role-badge {
          color: #FF6B2C;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1px;
        }
        .sidebar-logout {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: all 0.2s;
        }
        .sidebar-logout:hover { 
          background: #FF3B30; 
          color: white; 
          border-color: #FF3B30;
          box-shadow: 0 4px 15px rgba(255, 59, 48, 0.4);
        }

        @media (max-width: 768px) {
          .sidebar-mobile-toggle { display: flex; }
          .sidebar-overlay { display: block; }
          .sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 20px 0 60px rgba(0,0,0,0.6);
            width: 280px;
          }
          .sidebar.open { left: 0; }
        }
      `}</style>
    </>
  );
}
