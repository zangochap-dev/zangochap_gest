"use client";

import React, { useState, useTransition } from "react";
import { ShoppingBag, ChevronRight, AlertCircle, Info } from "lucide-react";
import { loginAction } from "@/modules/auth/actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
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

      <style jsx>{`
        .login-screen {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0A0908;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(212, 84, 28, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(212, 84, 28, 0.05) 0%, transparent 40%);
          position: fixed; top: 0; left: 0; z-index: 1000;
          overflow: hidden;
        }

        .login-screen::after {
          content: '';
          position: absolute;
          width: 100%; height: 100%;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.02;
          pointer-events: none;
        }

        .login-card {
          background: rgba(18, 16, 15, 0.7);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 
            0 32px 80px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.02);
          position: relative;
          z-index: 2;
        }

        .login-header { text-align: center; margin-bottom: 40px; }
        .login-logo-img { height: 50px; margin-bottom: 24px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2)); }
        
        .login-eyebrow { 
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; 
          color: rgba(255,255,255,0.4); margin-bottom: 12px;
        }
        .login-title { 
          font-size: 32px; font-weight: 700; letter-spacing: -0.03em; 
          margin-bottom: 12px; color: white;
        }
        .login-subtitle { color: rgba(255,255,255,0.4); font-size: 15px; max-width: 280px; margin: 0 auto; line-height: 1.5; }
        
        .field { margin-bottom: 24px; }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 10px; padding-left: 4px; }
        
        .input-wrapper { position: relative; }
        .field-input {
          width: 100%; height: 56px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 0 20px; color: white; font-size: 15px; outline: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .field-input:focus { 
          border-color: rgba(212, 84, 28, 0.5); 
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 4px rgba(212, 84, 28, 0.1);
        }
        
        .btn-primary {
          width: 100%; height: 58px; background: var(--orange); color: white; border: none; border-radius: 14px;
          font-weight: 700; font-size: 15px; letter-spacing: 0.02em;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-top: 16px;
          box-shadow: 0 10px 30px rgba(212, 84, 28, 0.2);
        }
        .btn-primary:hover:not(:disabled) { 
          background: #e65a20; 
          transform: translateY(-3px); 
          box-shadow: 0 15px 35px rgba(212, 84, 28, 0.35); 
        }
        .btn-primary:active { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 28px;
          text-align: center;
          display: flex; align-items: center; justify-content: center;
        }

        .login-footer {
          margin-top: 40px; text-align: center;
        }
        .login-footer p { color: rgba(255,255,255,0.2); font-size: 12px; letter-spacing: 0.02em; }

        @media (max-width: 480px) {
          .login-card { padding: 40px 24px; border-radius: 0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; border: none; }
          .login-screen { padding: 0; }
        }
      `}</style>
    </div>
  );
}
