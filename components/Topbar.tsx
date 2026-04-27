"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopbarProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value;
      if (q) router.push(`/orders?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="topbar">
      <h1>
        {title} {subtitle && <em>{subtitle}</em>}
      </h1>
      
      <div className="topbar-spacer" />
      
      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Rechercher partout..." 
            onKeyDown={handleSearch}
          />
        </div>
        {actions}
      </div>

      <style jsx>{`
        .topbar {
          background: white;
          border-bottom: 1px solid var(--line);
          padding: 14px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar h1 {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        .topbar h1 em { font-style: italic; font-weight: 500; color: var(--orange); }
        .topbar-spacer { flex: 1; }
        .topbar-actions { display: flex; gap: 8px; align-items: center; }
        .topbar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--cream);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 8px 12px;
          width: 280px;
          transition: all 0.2s;
        }
        .topbar-search:focus-within { border-color: var(--orange); background: white; box-shadow: 0 0 0 3px rgba(212,84,28,0.08); }
        .topbar-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; }

        @media (max-width: 768px) {
          .topbar { padding: 12px 16px 12px 60px; gap: 8px; }
          .topbar h1 { font-size: 18px; }
          .topbar-search { width: 40px; padding: 8px; justify-content: center; }
          .topbar-search input { display: none; }
          .topbar-search:focus-within { width: 180px; }
          .topbar-search:focus-within input { display: block; }
        }
      `}</style>
    </div>
  );
}
