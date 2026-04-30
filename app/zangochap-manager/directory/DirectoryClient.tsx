"use client";

import React, { useState, useMemo } from "react";
import { TableCard, EmptyState } from "@/components/UI";
import { Phone, Search, User as UserIcon, Shield, Briefcase, Truck, Package, Hammer } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";

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

      <style jsx>{`
        .directory-container {
          padding: 24px;
        }
        .directory-header {
          margin-bottom: 24px;
        }
        .filters-row {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-bar-wrap {
          position: relative;
          flex: 1;
          min-width: 300px;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--brown-soft);
          opacity: 0.6;
        }
        .directory-search {
          width: 100%;
          padding: 14px 14px 14px 48px;
          border-radius: 12px;
          border: 1.5px solid var(--line);
          background: white;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }
        .directory-search:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-soft);
        }

        .filter-group {
          min-width: 200px;
        }
        .directory-select {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--line);
          background: white;
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B4F3B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 48px;
          box-shadow: var(--shadow-sm);
        }
        .directory-select:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-soft);
        }

        .directory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 10px;
        }

        .directory-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .directory-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: var(--orange-soft);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          font-family: var(--font-display);
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 2px;
        }
        .user-role {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .phone-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          padding: 10px;
          border-radius: 10px;
          background: var(--cream);
          transition: all 0.2s;
        }
        .phone-link:hover {
          background: var(--cream-2);
        }
        .phone-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: white;
          color: var(--brown-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line);
        }
        .phone-details {
          display: flex;
          flex-direction: column;
        }
        .phone-number {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
        }
        .phone-label {
          font-size: 10px;
          color: var(--brown-soft);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .service-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--orange);
          background: var(--orange-soft);
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
        }

        .card-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--line);
        }
        .user-email {
          font-size: 12px;
          color: var(--brown-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .directory-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
