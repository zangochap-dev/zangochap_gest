import React from "react";
import SettingsNav from "./SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      flex: 1,
      overflow: 'hidden',
    }}>
      <SettingsNav />
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--cream)',
      }}>
        {children}
      </div>
    </div>
  );
}
