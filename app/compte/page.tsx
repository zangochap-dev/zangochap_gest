"use client";

import React, { useState } from "react";
import PublicLayout from "@/components/public/PublicLayout";
import { User, Mail, Phone, Lock, ArrowRight, ShoppingBag, MapPin, Eye, EyeOff } from "lucide-react";
import { loginCustomer, registerCustomer } from "@/modules/auth/customer-actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export default function ComptePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginCustomer(loginPhone, loginPassword);
      if (res.success) {
        showToast("Heureux de vous revoir !", "success");
        router.push("/");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerCustomer({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword
      });
      if (res.success) {
        showToast("Bienvenue chez Zangochap !", "success");
        router.push("/");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <PublicLayout>
      <div className="compte-page">
        <div className="compte-container">
          {/* HEADER */}
          <div className="compte-header">
            <h1>MON COMPTE</h1>
            <p>Connectez-vous pour suivre vos commandes et profiter d'avantages exclusifs.</p>
          </div>

          {/* TAB SWITCHER */}
          <div className="tab-switcher">
            <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>
              CONNEXION
            </button>
            <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>
              CRÉER UN COMPTE
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="compte-form">
              <div className="field">
                <label>TÉLÉPHONE</label>
                <div className="input-wrap">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>MOT DE PASSE</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                SE CONNECTER <ArrowRight size={16} />
              </button>

              <button type="button" className="forgot-link">Mot de passe oublié ?</button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="compte-form">
              <div className="field">
                <label>NOM COMPLET</label>
                <div className="input-wrap">
                  <User size={16} />
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Aminata Traoré"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>TÉLÉPHONE</label>
                <div className="input-wrap">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>EMAIL <span className="optional">(optionnel)</span></label>
                <div className="input-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div className="field">
                <label>MOT DE PASSE</label>
                <div className="input-wrap">
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Créer un mot de passe"
                    required
                    minLength={6}
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                CRÉER MON COMPTE <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ADVANTAGES */}
          <div className="advantages">
            <h3>POURQUOI CRÉER UN COMPTE ?</h3>
            <div className="adv-grid">
              <div className="adv-item">
                <ShoppingBag size={20} strokeWidth={1.3} />
                <div>
                  <strong>Suivi de commandes</strong>
                  <span>Suivez vos achats en temps réel</span>
                </div>
              </div>
              <div className="adv-item">
                <MapPin size={20} strokeWidth={1.3} />
                <div>
                  <strong>Adresses sauvegardées</strong>
                  <span>Commandez plus rapidement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .compte-page {
          display: flex;
          justify-content: center;
          padding: 60px 24px 100px;
          animation: fadeUp 0.5s ease;
        }
        .compte-container {
          width: 100%;
          max-width: 440px;
        }

        /* HEADER */
        .compte-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .compte-header h1 {
          font-size: 24px;
          font-weight: 200;
          letter-spacing: 0.25em;
          color: #1A1614;
          margin-bottom: 12px;
        }
        .compte-header p {
          font-size: 13px;
          color: #999;
          line-height: 1.6;
        }

        /* TABS */
        .tab-switcher {
          display: flex;
          border-bottom: 1px solid #e8e8e4;
          margin-bottom: 36px;
        }
        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 16px 0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #bbb;
          cursor: pointer;
          position: relative;
          transition: color 0.3s;
        }
        .tab-btn.active { color: #1A1614; }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 20%; right: 20%;
          height: 2px;
          background: #1A1614;
        }

        /* FORM */
        .compte-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
          animation: fadeUp 0.3s ease;
        }
        .field label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #999;
          margin-bottom: 8px;
        }
        .optional {
          color: #ccc;
          letter-spacing: 0;
          text-transform: none;
        }
        .input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #e8e8e4;
          padding: 0 16px;
          height: 52px;
          transition: border-color 0.25s;
          color: #bbb;
        }
        .input-wrap:focus-within {
          border-color: #1A1614;
          color: #1A1614;
        }
        .input-wrap input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1A1614;
          font-family: inherit;
          background: transparent;
        }
        .toggle-pw {
          background: none;
          border: none;
          cursor: pointer;
          color: #ccc;
          padding: 4px;
          transition: color 0.2s;
        }
        .toggle-pw:hover { color: #1A1614; }

        .submit-btn {
          width: 100%;
          height: 52px;
          background: #1A1614;
          color: white;
          border: none;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          transition: all 0.35s;
        }
        .submit-btn:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .forgot-link {
          background: none;
          border: none;
          color: #999;
          font-size: 12px;
          cursor: pointer;
          text-align: center;
          transition: color 0.2s;
          letter-spacing: 0.02em;
        }
        .forgot-link:hover { color: #1A1614; }

        /* ADVANTAGES */
        .advantages {
          margin-top: 60px;
          padding-top: 40px;
          border-top: 1px solid #f0f0f0;
        }
        .advantages h3 {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.2em;
          color: #bbb;
          text-align: center;
          margin-bottom: 28px;
        }
        .adv-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .adv-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 1px solid #f0f0f0;
          color: #1A1614;
        }
        .adv-item strong {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .adv-item span {
          font-size: 12px;
          color: #aaa;
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PublicLayout>
  );
}
