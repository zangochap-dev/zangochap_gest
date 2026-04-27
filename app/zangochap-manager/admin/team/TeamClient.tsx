"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, StatCard, EmptyState, DetailCard, StatusBadge } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { createAccount, updateAccount, deleteAccount } from "@/modules/auth/actions";
import { ROLE_LABELS, getInitials } from "@/lib/constants";
import { useRouter } from "next/navigation";
import {
  Plus, Edit3, Trash2, Mail, Phone, Shield,
  ShoppingBag, Package, Truck, Box, User,
  MoreVertical, Search, Filter
} from "lucide-react";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield size={18} />,
  commercial: <ShoppingBag size={18} />,
  packing: <Package size={18} />,
  collection: <Truck size={18} />,
  stock: <Box size={18} />,
  livreur: <Truck size={18} />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
  commercial: 'linear-gradient(135deg, #D4541C 0%, #A34015 100%)',
  packing: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
  collection: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
  stock: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
  livreur: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
};

export default function TeamClient({ accounts, currentUser }: { accounts: any[]; currentUser: any }) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();
  const router = useRouter();

  const byRole = useMemo(() => {
    const map: Record<string, any[]> = {};
    accounts.forEach(a => {
      const role = a.role.toLowerCase();
      if (!map[role]) map[role] = [];
      map[role].push(a);
    });
    return map;
  }, [accounts]);

  const filteredRoles = useMemo(() => {
    return Object.entries(ROLE_LABELS).filter(([role]) => {
      const users = byRole[role] || [];
      return users.some(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [byRole, searchTerm]);

  const handleDelete = (email: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${email} ?`)) return;
    deleteAccount(email).then(() => {
      showToast('Compte supprimé ✓', 'success');
      router.refresh();
    });
  };

  return (
    <div className="content animate-fade-in">
      {/* HEADER STATS */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Équipe"
          value={accounts.length}
          icon={<User size={20} />}
          accent
        />
        <StatCard
          label="Administrateurs"
          value={(byRole['admin'] || []).length}
          icon={<Shield size={20} />}
          color="var(--blue)"
        />
        <StatCard
          label="Terrain"
          value={(byRole['commercial'] || []).length + (byRole['livreur'] || []).length}
          icon={<Truck size={20} />}
          color="var(--orange)"
        />
        <StatCard
          label="Logistique"
          value={(byRole['packing'] || []).length + (byRole['collection'] || []).length}
          icon={<Package size={20} />}
          color="var(--green)"
        />
      </div>

      {/* SEARCH & ACTION */}
      <div className="team-actions-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-orange" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nouveau membre
        </button>
      </div>

      {/* TEAM SECTIONS BY ROLE */}
      <div className="team-sections">
        {filteredRoles.length === 0 ? (
          <EmptyState icon="👥" title="Aucun membre trouvé" description="Essayez une autre recherche." />
        ) : (
          filteredRoles.map(([role, label]) => (
            <div key={role} className="role-section">
              <div className="role-header">
                <div className="role-info">
                  <div className="role-icon-box" style={{ background: ROLE_COLORS[role] }}>
                    {ROLE_ICONS[role]}
                  </div>
                  <div>
                    <h3 className="role-title">{label}</h3>
                    <span className="role-count">{(byRole[role] || []).length} membres</span>
                  </div>
                </div>
              </div>

              <div className="team-grid">
                {(byRole[role] || [])
                  .filter(a =>
                    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(member => (
                    <div key={member.id} className="member-card">
                      <div className="member-card-inner">
                        <div className="member-avatar" style={{ background: ROLE_COLORS[role] }}>
                          {member.initials || getInitials(member.name)}
                        </div>

                        <div className="member-info">
                          <div className="member-name">{member.name}</div>
                          <div className="member-email">
                            <Mail size={12} />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="member-phone">
                              <Phone size={12} />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="member-actions">
                          <button className="action-btn-circle" onClick={() => setEditing(member)} title="Modifier">
                            <Edit3 size={14} />
                          </button>
                          {member.email !== currentUser.email && (
                            <button
                              className="action-btn-circle delete"
                              onClick={() => handleDelete(member.email)}
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {showNew && <AccountModal onClose={() => setShowNew(false)} />}
      {editing && <AccountModal account={editing} onClose={() => setEditing(null)} />}

      <style jsx>{`
        .team-actions-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          align-items: center;
        }
        .search-box {
          position: relative;
          flex: 1;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--brown-soft);
          opacity: 0.5;
        }
        .search-box input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 44px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-box input:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-soft);
        }

        .role-section {
          margin-bottom: 40px;
        }
        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }
        .role-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .role-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .role-title {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          color: var(--ink);
        }
        .role-count {
          font-size: 12px;
          color: var(--brown-soft);
          font-weight: 500;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .member-card {
          background: white;
          border-radius: 16px;
          border: 1px solid var(--line);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: var(--orange-soft);
        }
        .member-card-inner {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .member-avatar {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }
        .member-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--ink);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .member-email, .member-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--brown-soft);
          margin-top: 2px;
        }
        .member-email span, .member-phone span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .action-btn-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: var(--cream);
          color: var(--brown);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-circle:hover {
          background: white;
          color: var(--orange);
          border-color: var(--orange);
          transform: scale(1.1);
        }
        .action-btn-circle.delete:hover {
          background: #FEF2F2;
          color: #EF4444;
          border-color: #FCA5A5;
        }

        @media (max-width: 640px) {
          .team-actions-bar { flex-direction: column; align-items: stretch; }
          .team-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );

  function AccountModal({ account, onClose }: { account?: any; onClose: () => void }) {
    const [name, setName] = useState(account?.name || '');
    const [email, setEmail] = useState(account?.email || '');
    const [phone, setPhone] = useState(account?.phone || '');
    const [role, setRole] = useState(account?.role?.toLowerCase() || '');
    const [password, setPassword] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(async () => {
        try {
          if (account) {
            await updateAccount(account.email, { name, email, phone, role, password: password || undefined });
            showToast('Compte mis à jour ✓', 'success');
          } else {
            if (!password) { showToast('Mot de passe requis', 'error'); return; }
            const result = await createAccount({ name, email, phone, password, role });
            if (!result.success) { showToast(result.error || 'Erreur', 'error'); return; }
            showToast('Nouveau membre ajouté ✓', 'success');
          }
          router.refresh();
          onClose();
        } catch (e: any) {
          showToast(e.message || 'Erreur', 'error');
        }
      });
    };

    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={account ? 'Modifier le membre' : 'Ajouter un membre'}
        footer={
          <>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button
              className="btn-orange"
              onClick={() => (document.getElementById('accForm') as HTMLFormElement)?.requestSubmit()}
              disabled={isPending}
            >
              {isPending ? 'Enregistrement...' : account ? 'Enregistrer' : 'Ajouter au hub'}
            </button>
          </>
        }
      >
        <form id="accForm" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row span-2">
              <label className="field-label">Nom complet *</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex. Marc Kouassi" />
            </div>
            <div className="form-row">
              <label className="field-label">Email professionnel *</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nom@zangochap.ci" />
            </div>
            <div className="form-row">
              <label className="field-label">Rôle au sein de l'équipe *</label>
              <select className="field-input" value={role} onChange={e => setRole(e.target.value)} required>
                <option value="">Sélectionner un rôle...</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="field-label">Numéro WhatsApp</label>
              <input className="field-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 00 00 00 00" />
            </div>
            <div className="form-row span-2">
              <label className="field-label">{account ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe temporaire *'}</label>
              <input className="field-input" type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••" minLength={account ? 0 : 4} required={!account} />
              <p style={{ fontSize: 11, color: 'var(--brown-soft)', marginTop: 4 }}>
                {account ? 'Laissez vide pour conserver le mot de passe actuel.' : 'Le membre pourra le changer lors de sa première connexion.'}
              </p>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}
