"use client";

import React, { useState, useMemo } from "react";
import { TableCard, EmptyState } from "@/components/UI";
import { Phone, Search, User as UserIcon, Shield, Briefcase, Truck, Package, Hammer } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import "./directory-client.css";

interface DirectoryUser {
  id: string;
  name: string;
  phone: string | null;
  phone2: string | null;
  serviceLabel: string | null;
  role: string;
  email: string;
}

export default function DirectoryClient({ users }: { users: DirectoryUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").includes(search) ||
        (u.phone2 || "").includes(search) ||
        ROLE_LABELS[u.role.toLowerCase()]?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield size={16} />;
      case 'COMMERCIAL': return <Briefcase size={16} />;
      case 'LIVREUR': return <Truck size={16} />;
      case 'PACKING': return <Package size={16} />;
      case 'COLLECTION': return <Hammer size={16} />;
      default: return <UserIcon size={16} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#EF4444';
      case 'COMMERCIAL': return '#3B82F6';
      case 'LIVREUR': return '#10B981';
      case 'PACKING': return '#F59E0B';
      case 'COLLECTION': return '#8B5CF6';
      default: return 'var(--brown-soft)';
    }
  };

  return (
    <div className="directory-container animate-fade-in">
      <div className="directory-header">
        <div className="filters-row">
          <div className="search-bar-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher un membre..." 
              className="directory-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select 
              className="directory-select" 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <TableCard title="Répertoire d'équipe" meta={`${filteredUsers.length} membre(s)`}>
        {filteredUsers.length === 0 ? (
          <EmptyState icon="👤" title="Aucun membre trouvé" description="Essayez une autre recherche." />
        ) : (
          <div className="directory-grid">
            {filteredUsers.map(u => (
              <div key={u.id} className="directory-card">
                <div className="card-top">
                  <div className="user-avatar" style={{ background: `${getRoleColor(u.role)}20`, color: getRoleColor(u.role) }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.name}</div>
                    <div className="user-role" style={{ color: getRoleColor(u.role) }}>
                      {getRoleIcon(u.role)}
                      <span>{ROLE_LABELS[u.role.toLowerCase()] || u.role}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  {u.phone ? (
                    <a href={`tel:${u.phone}`} className="phone-link">
                      <div className="phone-icon-wrap"><Phone size={14} /></div>
                      <div className="phone-details">
                        <div className="phone-number">{u.phone}</div>
                        <div className="phone-label">Principal</div>
                      </div>
                    </a>
                  ) : (
                    <div className="phone-link disabled">
                      <div className="phone-icon-wrap"><Phone size={14} /></div>
                      <div className="phone-number">Aucun numéro</div>
                    </div>
                  )}

                  {u.phone2 && (
                    <a href={`tel:${u.phone2}`} className="phone-link service">
                      <div className="phone-icon-wrap" style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }}>
                        <Phone size={14} />
                      </div>
                      <div className="phone-details">
                        <div className="phone-number">{u.phone2}</div>
                        <div className="phone-label">
                          {u.serviceLabel ? `Service : ${u.serviceLabel}` : 'Secondaire'}
                        </div>
                      </div>
                    </a>
                  )}
                  
                  {!u.phone2 && u.serviceLabel && (
                    <div className="service-badge">
                      <Briefcase size={12} />
                      <span>{u.serviceLabel}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="user-email">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TableCard>

      
    </div>
  );
}
