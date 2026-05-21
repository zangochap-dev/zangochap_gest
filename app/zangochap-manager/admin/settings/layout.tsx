import React from "react";
import SettingsNav from "./SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-shell">
      <SettingsNav />
      <div className="settings-stage">{children}</div>
    </div>
  );
}
