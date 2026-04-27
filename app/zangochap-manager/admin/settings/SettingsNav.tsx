"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Store, MapPin, Tag, Users,
  Settings, ChevronLeft
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Catégories",
    href: "/zangochap-manager/admin/settings/categories",
    icon: <LayoutGrid size={16} />,
    desc: "Organiser les produits",
  },
  {
    label: "Fournisseurs",
    href: "/zangochap-manager/admin/settings/suppliers",
    icon: <Store size={16} />,
    desc: "Partenaires & sources",
  },
  {
    label: "Communes & Livraison",
    href: "/zangochap-manager/admin/settings/communes",
    icon: <MapPin size={16} />,
    desc: "Zones & frais de livraison",
  },
  {
    label: "Codes Promo",
    href: "/zangochap-manager/admin/settings/promos",
    icon: <Tag size={16} />,
    desc: "Réductions & offres",
  },
  {
    label: "Équipe & Accès",
    href: "/zangochap-manager/admin/settings/team",
    icon: <Users size={16} />,
    desc: "Membres & rôles",
  },
];

export default function SettingsNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="settings-nav">
      <div className="nav-header">
        <Link href="/zangochap-manager" className="nav-back">
          <ChevronLeft size={14} />
          <span>Retour</span>
        </Link>
        <div className="nav-title">
          <Settings size={16} />
          Configuration
        </div>
      </div>
      <nav className="nav-list">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <div className="nav-text">
              <span className="nav-label">{item.label}</span>
              <span className="nav-desc">{item.desc}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
