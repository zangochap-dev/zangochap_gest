"use client";

import React, { useState, useTransition } from "react";
import { ShoppingBag, ChevronRight, AlertCircle, Info } from "lucide-react";
import { loginAction } from "@/modules/auth/actions";
import { useRouter } from "next/navigation";

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
        <div className="login-logo">
          <div className="login-logo-mark">
            <ShoppingBag size={22} color="white" />
          </div>
          <div className="login-logo-text">ZANGOCHAP</div>
        </div>

        <div className="login-eyebrow">Espace équipe</div>
        <h1 className="login-title">Bienvenue</h1>
        <p className="login-subtitle">Connecte-toi avec ton compte professionnel.</p>

        {error && (
          <div className="login-error show">
            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} suppressHydrationWarning>
          <div className="field">
            <label className="field-label">Email</label>
            <input 
              type="email" 
              name="email"
              className="field-input" 
              placeholder="prenom@zangochap.ci"
              required 
              suppressHydrationWarning
            />
          </div>
          <div className="field">
            <label className="field-label">Mot de passe</label>
            <input 
              type="password" 
              name="password"
              className="field-input" 
              placeholder="••••••••"
              required 
              suppressHydrationWarning
            />
          </div>

          <button className="btn-primary" type="submit" disabled={isPending}>
            {isPending ? "Connexion..." : "Se connecter"}
            {!isPending && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="demo-creds">
          <strong>
            <Info size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Comptes de démo
          </strong>
          <div className="cred-row"><span>Administrateur</span><code>admin@zangochap.ci · demo</code></div>
          <div className="cred-row"><span>Commercial</span><code>com@zangochap.ci · demo</code></div>
          <div className="cred-row"><span>Gestion Stock</span><code>stock@zangochap.ci · demo</code></div>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #0F0D0C;
          background-image: 
            radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 40px 40px;
          position: fixed; top: 0; left: 0; z-index: 1000;
        }
        .login-screen::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(212, 84, 28, 0.08), transparent 70%);
          pointer-events: none;
        }
        .login-card {
          background: rgba(26, 22, 20, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 48px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          position: relative;
          z-index: 2;
        }
        .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; justify-content: center; }
        .login-logo-mark {
          width: 40px; height: 40px;
          background: var(--orange);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 16px rgba(212, 84, 28, 0.3);
        }
        .login-logo-text { font-family: var(--font-display); font-weight: 800; font-size: 24px; letter-spacing: 0.05em; color: white; }
        
        .login-eyebrow { 
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; 
          color: var(--orange); margin-bottom: 8px; text-align: center;
        }
        .login-title { 
          font-family: var(--font-display); font-size: 32px; font-weight: 700; letter-spacing: -0.02em; 
          margin-bottom: 8px; color: white; text-align: center;
        }
        .login-subtitle { color: rgba(255,255,255,0.4); font-size: 14px; margin-bottom: 36px; text-align: center; }
        
        .field { margin-bottom: 20px; }
        .field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
        .field-input {
          width: 100%; height: 50px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 0 16px; color: white; font-size: 14px; outline: none; transition: all 0.2s;
        }
        .field-input:focus { border-color: var(--orange); background: rgba(255,255,255,0.06); }
        
        .btn-primary {
          width: 100%; height: 52px; background: var(--orange); color: white; border: none; border-radius: 8px;
          font-weight: 700; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.3s; margin-top: 12px;
        }
        .btn-primary:hover:not(:disabled) { background: var(--orange-dark); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(212, 84, 28, 0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-error {
          background: rgba(199, 62, 29, 0.1);
          border: 1px solid rgba(199, 62, 29, 0.2);
          color: #FF6B6B;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .demo-creds {
          margin-top: 32px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.05); font-size: 11px;
        }
        .demo-creds strong { color: white; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 12px; }
        .demo-creds code { font-family: var(--font-mono); color: var(--orange); background: rgba(212,84,28,0.1); padding: 2px 6px; border-radius: 4px; }
        .cred-row { padding: 6px 0; display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.4); }
        .cred-row span { font-weight: 600; color: rgba(255,255,255,0.7); }
      `}</style>
    </div>
  );
}
