"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import "./topbar.css";

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

      
    </div>
  );
}
