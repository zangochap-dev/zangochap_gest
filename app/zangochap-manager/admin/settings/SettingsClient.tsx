"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutGrid, Store, MapPin, Tag, Users,
  ArrowRight, Settings
} from "lucide-react";

const SECTIONS = [
  {
    title: "Catégories",
    description: "Organisez votre catalogue en catégories thématiques pour faciliter la navigation des clients.",
    href: "/zangochap-manager/admin/settings/categories",
    icon: <LayoutGrid size={22} />,
    iconColor: "#4F46E5",
    bgColor: "#EEF2FF",
  },
  {
    title: "Fournisseurs",
    description: "Gérez votre annuaire de fournisseurs, contacts et sources d'approvisionnement.",
    href: "/zangochap-manager/admin/settings/suppliers",
    icon: <Store size={22} />,
    iconColor: "#D97706",
    bgColor: "#FFF7ED",
  },
  {
    title: "Communes & Livraison",
    description: "Configurez les zones de livraison et les tarifs par commune d'Abidjan.",
    href: "/zangochap-manager/admin/settings/communes",
    icon: <MapPin size={22} />,
    iconColor: "#059669",
    bgColor: "#ECFDF5",
  },
  {
    title: "Codes Promo",
    description: "Créez et pilotez vos campagnes de réductions et offres spéciales.",
    href: "/zangochap-manager/admin/settings/promos",
    icon: <Tag size={22} />,
    iconColor: "#7C3AED",
    bgColor: "#F5F3FF",
  },
  {
    title: "Équipe & Accès",
    description: "Gérez les comptes utilisateurs, les rôles et les permissions de votre équipe.",
    href: "/zangochap-manager/admin/settings/team",
    icon: <Users size={22} />,
    iconColor: "#2563EB",
    bgColor: "#EFF6FF",
  },
];

export default function SettingsClient() {
  return (
    <div className="settings-overview">
      <div className="overview-header">
        <div className="overview-icon">
          <Settings size={28} />
        </div>
        <div>
          <h1>Configuration du système</h1>
          <p>Personnalisez les paramètres de votre plateforme Zangochap.</p>
        </div>
      </div>

      <div className="overview-grid">
        {SECTIONS.map((s, i) => (
          <Link key={i} href={s.href} className="overview-card">
            <div className="card-icon" style={{ backgroundColor: s.bgColor, color: s.iconColor }}>
              {s.icon}
            </div>
            <div className="card-body">
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
            <ArrowRight size={16} className="card-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
