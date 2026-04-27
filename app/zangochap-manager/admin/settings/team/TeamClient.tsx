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
  MoreVertical, Search, Filter,
  X
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
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
          <input
            type="text"
            className="field-input"
            placeholder="Rechercher par nom, email, rôle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 500 }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#DEE2E6', border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--brown-soft)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button className="btn-orange" onClick={() => setShowNew(true)} style={{ height: 44 }}>
          <Plus size={16} /> Nouveau membre
        </button>
      </div>

      {/* TEAM SECTIONS BY ROLE */}
      <div className="team-sections">
        {filteredRoles.length === 0 ? (
          <EmptyState icon="👥" title="Aucun membre trouvé" description="Essayez une autre recherche." />
        ) : (
          filteredRoles.map(([role, label]) => {
            const roleUsers = (byRole[role] || []).filter(a =>
              a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              a.email.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (roleUsers.length === 0) return null;

            return (
              <div key={role} className="role-section">
                <div className="role-header-premium">
                  <div className="role-info-pill" style={{ background: ROLE_COLORS[role] }}>
                    {ROLE_ICONS[role]}
                    <span>{label}</span>
                  </div>
                  <div className="role-meta-badge">{roleUsers.length} membres</div>
                </div>

                <div className="team-grid">
                  {roleUsers.map(member => (
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
            );
          })
        )}
      </div>

      {/* MODALS */}
      {showNew && <AccountModal onClose={() => setShowNew(false)} />}
      {editing && <AccountModal account={editing} onClose={() => setEditing(null)} />}

      <style jsx>{`
        .role-section {
          margin-bottom: 32px;
        }
        .role-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .role-info-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          border-radius: 20px;
          color: white;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .role-meta-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--brown-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--cream-2);
          padding: 4px 10px;
          border-radius: 6px;
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
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--orange-soft);
        }
        .member-card-inner {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .member-avatar {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
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
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .member-email, .member-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--brown-soft);
          margin-top: 1px;
          opacity: 0.8;
        }
        .member-email span, .member-phone span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .action-btn-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: var(--cream);
          color: var(--brown-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .action-btn-circle:hover {
          background: white;
          color: var(--orange);
          border-color: var(--orange);
          transform: scale(1.05);
        }
        .action-btn-circle.delete:hover {
          background: #FEF2F2;
          color: #EF4444;
          border-color: #FCA5A5;
        }

        @media (max-width: 640px) {
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
