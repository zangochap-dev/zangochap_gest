"use client";

import React, { useState, useTransition } from "react";
import { ShoppingBag, ChevronRight, AlertCircle, Info } from "lucide-react";
import { loginAction } from "@/modules/auth/actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./login-client.css";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="login-screen">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <img src="/logo.png" alt="ZangoChap Logo" width="160" height="50" className="login-logo-img h-auto mx-auto block" />
          <div className="login-eyebrow">ZangoChap Manager</div>
          <h1 className="login-title">Bon retour</h1>
        </div>

        {error && (
          <div className="login-error show">
            <AlertCircle size={14} className="login-error-icon" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} suppressHydrationWarning>
          <div className="field">
            <label className="field-label">Adresse Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                className="field-input"
                placeholder="votre@email.ci"
                required
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Mot de passe</label>
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                className="field-input"
                placeholder="••••••••"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={isPending}>
            {isPending ? "Connexion en cours..." : "Accéder au tableau de bord"}
            {!isPending && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} ZangoChap. Tous droits réservés.</p>
        </div>
      </div>

      
    </div>
  );
}
