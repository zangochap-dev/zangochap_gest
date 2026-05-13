"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { logoutAction } from "@/modules/auth/actions";
import { ROLE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import {
  LayoutDashboard, ShoppingBag, Package, Truck, Box, Users, BarChart3,
  Tag, Upload, FileText, LogOut, ClipboardList,
  AlertTriangle, Settings, MapPin, Store, ChevronRight, ChevronLeft, History, Wallet, Warehouse,
  User, ExternalLink, Image as ImageIcon, Menu, X, Bell, WifiOff, RefreshCw
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

const NAV_FOR_ROLE: Record<string, (counts?: any) => any[]> = {
  commercial: (counts) => [
    { items: [{ label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
    { title: 'Commandes', items: [{ label: 'Toutes les commandes', href: '/zangochap-manager/orders', icon: <ShoppingBag size={18} />, badge: counts?.orders }, { label: 'À traiter (site)', href: '/zangochap-manager/orders/to-process', icon: <AlertTriangle size={18} />, badge: counts?.toProcess }, { label: 'Non emballées', href: '/zangochap-manager/orders/non-packed', icon: <Package size={18} /> }, { label: 'Nouvelle commande', href: '/zangochap-manager/orders/new', icon: <ClipboardList size={18} /> }] },
    { title: 'Clients', items: [{ label: 'CRM Clients', href: '/zangochap-manager/admin/crm', icon: <Users size={18} /> }] },
  ],
  packing: (counts) => [
    { items: [{ label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
    { title: 'Logistique', items: [{ label: 'Emballage', href: '/zangochap-manager/logistics/packing', icon: <Package size={18} />, badge: counts?.packing }, { label: 'Fiche vérification', href: '/zangochap-manager/logistics/verification', icon: <FileText size={18} /> }] },
    { title: 'Catalogue', items: [{ label: 'Tous les produits', href: '/zangochap-manager/products', icon: <Box size={18} /> }, { label: 'Ajouter un produit', href: '/zangochap-manager/products/new', icon: <ClipboardList size={18} /> }] },
  ],
  collection: (counts) => [
    { items: [{ label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
    { title: 'Logistique', items: [{ label: 'Collecte', href: '/zangochap-manager/logistics/collection', icon: <Truck size={18} />, badge: counts?.collection }] },
  ],
  stock: (counts) => [
    { items: [{ label: 'Vue globale', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
    { title: 'Inventaire', items: [{ label: 'Tous les produits', href: '/zangochap-manager/products', icon: <Box size={18} /> }, { label: 'Ruptures de stock', href: '/zangochap-manager/products/shortages', icon: <AlertTriangle size={18} /> }, { label: 'Historique stock', href: '/zangochap-manager/inventory/history', icon: <History size={18} /> }, { label: 'Entrepôts', href: '/zangochap-manager/logistics/warehouses', icon: <Warehouse size={18} /> }] },
  ],
  admin: (counts) => [
    { items: [{ label: 'Dashboard', href: '/zangochap-manager/dashboard', icon: <LayoutDashboard size={18} /> }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
    { title: 'Opérations', items: [{ label: 'Commandes', href: '/zangochap-manager/orders', icon: <ShoppingBag size={18} />, badge: counts?.orders }, { label: 'Emballage', href: '/zangochap-manager/logistics/packing', icon: <Package size={18} />, badge: counts?.packing }, { label: 'Collecte', href: '/zangochap-manager/logistics/collection', icon: <Truck size={18} />, badge: counts?.collection }] },
    { title: 'Catalogue', items: [{ label: 'Produits', href: '/zangochap-manager/products', icon: <Box size={18} /> }, { label: 'Ajouter', href: '/zangochap-manager/products/new', icon: <ClipboardList size={18} /> }] },
    { title: 'Pilotage', items: [{ label: 'Livreurs', href: '/zangochap-admin/delivery', icon: <Truck size={18} /> }, { label: 'Settings', href: '/zangochap-manager/admin/settings', icon: <Settings size={18} /> }] },
  ],
  livreur: (counts) => [
    { items: [{ label: 'Mes Livraisons', href: '/zangochap-rider', icon: <Truck size={18} />, badge: counts?.myDeliveries }, { label: 'Répertoire', href: '/zangochap-manager/directory', icon: <Users size={18} /> }] },
  ],
};

export default function Sidebar({ user, counts }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const prevCounts = useRef(counts);
  const { showToast } = useToast();

  const sections = (NAV_FOR_ROLE[user.role] || NAV_FOR_ROLE.admin)(counts);
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  // Track Online/Offline Status
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); showToast("Connexion rétablie ! Synchronisation...", "success"); };
    const handleOffline = () => { setIsOffline(true); showToast("Mode hors-ligne activé. 📡", "error"); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker Registered');
      });
    }
  }, []);

  // Track New Orders / Packing Tasks
  useEffect(() => {
    if (!prevCounts.current || isOffline) {
      prevCounts.current = counts;
      return;
    }

    const newPacking = (counts?.packing || 0) > (prevCounts.current?.packing || 0);
    const newOrders = (counts?.orders || 0) > (prevCounts.current?.orders || 0);

    if (newPacking || newOrders) {
      setHasNewNotifications(true);
      showToast(newPacking ? "Nouvelle commande à emballer ! 📦" : "Nouvelle commande reçue ! 🛍️", "success");
      
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("ZangoChap Manager", {
          body: newPacking ? "Vous avez une nouvelle commande à préparer." : "Une nouvelle commande vient d'arriver.",
          icon: "/logo.png"
        });
      }

      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    prevCounts.current = counts;
  }, [counts, showToast, isOffline]);

  useEffect(() => {
    setIsMobileOpen(false);
    setShowNotifications(false);
  }, [pathname]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="mobile-top-bar">
        <button className="mobile-nav-trigger" onClick={() => setIsMobileOpen(true)}><Menu size={24} /></button>
        <div className="mobile-logo-center">
          <Image src="/logo.png" alt="Logo" width={100} height={30} style={{ objectFit: 'contain' }} />
          {isOffline && <WifiOff size={14} color="#FF3B30" style={{ marginLeft: 8 }} />}
        </div>
        <button className="mobile-notif-btn" onClick={() => setShowNotifications(!showNotifications)}>
          <Bell size={22} color={hasNewNotifications ? 'var(--orange)' : '#8E8E93'} />
          {hasNewNotifications && <span className="notif-dot" />}
        </button>
      </div>

      {/* OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileOpen(false)} className="sidebar-overlay" />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Link href="/zangochap-manager/dashboard" className="logo-link">
              <Image src="/logo.png" alt="ZANGOCHAP" width={140} height={40} className="logo-img" priority />
              <div className="logo-icon-mini">Z</div>
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isOffline && (
              <div className="offline-badge" title="Mode hors-ligne">
                <WifiOff size={16} />
              </div>
            )}
            <button 
              className={`notif-btn-desktop ${hasNewNotifications ? 'has-new' : ''}`}
              onClick={() => { setShowNotifications(!showNotifications); setHasNewNotifications(false); }}
            >
              <Bell size={20} />
              {hasNewNotifications && <span className="notif-dot" />}
            </button>
            <button className="mobile-close" onClick={() => setIsMobileOpen(false)}><X size={20} /></button>
          </div>
        </div>

        {/* OFFLINE STATUS BANNER */}
        {isOffline && (
          <div className="offline-banner">
            <WifiOff size={12} />
            <span>Mode hors-ligne</span>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-container">
            {sections.map((section: any, sIdx: number) => (
              <div key={sIdx} className="sidebar-section">
                {section.title && !isCollapsed && <div className="sidebar-section-title">{section.title}</div>}
                {section.items.map((item: any) => {
                  const isActive = pathname === item.href || (item.href !== '/zangochap-manager/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                      <div className="sidebar-link-inner">
                        <span className="icon-wrapper">{item.icon}</span>
                        {!isCollapsed && <span className="label-text">{item.label}</span>}
                      </div>
                      {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{user.initials}</div>
              {!isCollapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.name}</div>
                  <div className="sidebar-role-badge">{roleLabel}</div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <form action={logoutAction}>
                <button type="submit" className="sidebar-logout"><LogOut size={14} /></button>
              </form>
            )}
          </div>
          <button className="sidebar-collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!isCollapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      <style jsx>{`
        .sidebar { width: 260px; background: #0F1115; color: white; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; z-index: 1000; border-right: 1px solid rgba(255,255,255,0.05); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar.collapsed { width: 76px; }

        @media (max-width: 1024px) {
          .sidebar { position: fixed; left: -280px; width: 280px; border-right: none; }
          .sidebar.mobile-open { left: 0; }
          .sidebar.collapsed { width: 280px; }
        }

        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; }

        .mobile-top-bar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: white;
          border-bottom: 1px solid #E5E5EA;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 900;
        }
        @media (max-width: 1024px) { .mobile-top-bar { display: flex; } }

        .mobile-nav-trigger, .mobile-notif-btn { background: transparent; border: none; padding: 8px; position: relative; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; background: #FF3B30; border-radius: 50%; border: 2px solid white; }
        .sidebar .notif-dot { border-color: #0F1115; top: 2px; right: 2px; }

        .offline-badge { background: rgba(255, 59, 48, 0.1); color: #FF3B30; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .offline-banner { background: #FF3B30; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; letter-spacing: 0.05em; }

        .notif-btn-desktop { background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.4); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; transition: all 0.2s; }
        .notif-btn-desktop:hover, .notif-btn-desktop.has-new { color: white; background: rgba(255,255,255,0.1); }
        .notif-btn-desktop.has-new { color: #FF6B2C; }

        .mobile-close { display: none; background: rgba(255,255,255,0.05); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; align-items: center; justify-content: center; }
        @media (max-width: 1024px) { .mobile-close { display: flex; } }

        .sidebar-header { padding: 20px 18px; display: flex; justify-content: space-between; align-items: center; }
        .sidebar-logo { display: flex; align-items: center; }
        .logo-icon-mini { display: none; width: 40px; height: 40px; background: #FF6B2C; border-radius: 12px; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: white; }
        .sidebar.collapsed .logo-img { display: none; }
        .sidebar.collapsed .logo-icon-mini { display: flex; }

        .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 14px; }
        .sidebar-section { margin-bottom: 24px; }
        .sidebar-section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: rgba(255,255,255,0.25); padding: 0 12px 12px; }

        :global(.sidebar-link) { display: flex; align-items: center; justify-content: space-between; padding: 11px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4); text-decoration: none; margin-bottom: 2px; transition: all 0.2s; }
        :global(.sidebar-link:hover) { background: rgba(255,255,255,0.03); color: white; }
        :global(.sidebar-link.active) { background: rgba(255,107,44,0.1); color: #FF6B2C; font-weight: 700; }
        .sidebar-link-inner { display: flex; align-items: center; gap: 12px; }
        .icon-wrapper { display: flex; align-items: center; opacity: 0.6; }
        :global(.sidebar-link.active .icon-wrapper) { opacity: 1; color: #FF6B2C; }

        .sidebar-badge { background: #FF6B2C; color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 6px; }

        .sidebar-footer { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .user-card { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 10px; border-radius: 16px; }
        .sidebar-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .sidebar-avatar { width: 38px; height: 38px; background: #FF6B2C; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: white; }
        .sidebar-user-name { font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-role-badge { color: #FF6B2C; font-size: 9px; font-weight: 800; text-transform: uppercase; }
        .sidebar-logout { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); border: none; cursor: pointer; }
        .sidebar-logout:hover { background: #FF3B30; color: white; }
        .sidebar-collapse-toggle { background: transparent; border: none; color: rgba(255,255,255,0.2); font-size: 11px; font-weight: 700; padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        @media (max-width: 1024px) { .sidebar-collapse-toggle { display: none; } }
      `}</style>
    </>
  );
}
