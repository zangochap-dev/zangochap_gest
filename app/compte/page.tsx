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
      <div className="flex justify-center px-6 py-[60px] pb-[100px] animate-[fadeUp_0.5s_ease] font-body">
        <div className="w-full max-w-[440px]">
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-extralight tracking-[0.25em] text-[#1A1614] mb-3 uppercase">MON COMPTE</h1>
            <p className="text-[13px] text-[#999] leading-relaxed">Connectez-vous pour suivre vos commandes et profiter d'avantages exclusifs.</p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b border-[#e8e8e4] mb-9">
            <button 
              className={`flex-1 bg-none border-none py-4 text-[11px] font-medium tracking-[0.15em] cursor-pointer relative transition-colors ${tab === "login" ? "text-[#1A1614]" : "text-[#bbb]"}`} 
              onClick={() => setTab("login")}
            >
              CONNEXION
              {tab === "login" && <span className="absolute -bottom-px left-[20%] right-[20%] h-0.5 bg-[#1A1614]" />}
            </button>
            <button 
              className={`flex-1 bg-none border-none py-4 text-[11px] font-medium tracking-[0.15em] cursor-pointer relative transition-colors ${tab === "register" ? "text-[#1A1614]" : "text-[#bbb]"}`} 
              onClick={() => setTab("register")}
            >
              CRÉER UN COMPTE
              {tab === "register" && <span className="absolute -bottom-px left-[20%] right-[20%] h-0.5 bg-[#1A1614]" />}
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-5.5 animate-[fadeUp_0.3s_ease]">
              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">TÉLÉPHONE</label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">MOT DE PASSE</label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                  <button type="button" className="bg-none border-none cursor-pointer text-[#ccc] p-1 transition-colors hover:text-[#1A1614]" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full h-[52px] bg-[#1A1614] text-white border-none text-[12px] font-semibold tracking-[0.15em] cursor-pointer flex items-center justify-center gap-2.5 mt-2 transition-all duration-350 hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-[0_8_24px_rgba(0,0,0,0.1)]">
                SE CONNECTER <ArrowRight size={16} />
              </button>

              <button type="button" className="bg-none border-none text-[#999] text-[12px] cursor-pointer text-center transition-colors hover:text-[#1A1614] tracking-wide">Mot de passe oublié ?</button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5.5 animate-[fadeUp_0.3s_ease]">
              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">NOM COMPLET</label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <User size={16} />
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Aminata Traoré"
                    required
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">TÉLÉPHONE</label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="07 00 00 00 00"
                    required
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">EMAIL <span className="text-[#ccc] normal-case tracking-normal">(optionnel)</span></label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-medium tracking-[0.12em] text-[#999] uppercase">MOT DE PASSE</label>
                <div className="flex items-center gap-3 border border-[#e8e8e4] px-4 h-[52px] transition-colors focus-within:border-[#1A1614] focus-within:text-[#1A1614] text-[#bbb]">
                  <Lock size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Créer un mot de passe"
                    required
                    minLength={6}
                    className="flex-1 border-none outline-none text-sm text-[#1A1614] bg-transparent font-inherit"
                  />
                  <button type="button" className="bg-none border-none cursor-pointer text-[#ccc] p-1 transition-colors hover:text-[#1A1614]" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full h-[52px] bg-[#1A1614] text-white border-none text-[12px] font-semibold tracking-[0.15em] cursor-pointer flex items-center justify-center gap-2.5 mt-2 transition-all duration-350 hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-[0_8_24px_rgba(0,0,0,0.1)]">
                CRÉER MON COMPTE <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ADVANTAGES */}
          <div className="mt-[60px] pt-10 border-t border-[#f0f0f0]">
            <h3 className="text-[11px] font-normal tracking-[0.2em] text-[#bbb] text-center mb-7 uppercase">POURQUOI CRÉER UN COMPTE ?</h3>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 p-5 border border-[#f0f0f0] text-[#1A1614]">
                <ShoppingBag size={20} strokeWidth={1.3} />
                <div>
                  <strong className="block text-[13px] font-medium mb-0.5">Suivi de commandes</strong>
                  <span className="text-[12px] text-[#aaa]">Suivez vos achats en temps réel</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 border border-[#f0f0f0] text-[#1A1614]">
                <MapPin size={20} strokeWidth={1.3} />
                <div>
                  <strong className="block text-[13px] font-medium mb-0.5">Adresses sauvegardées</strong>
                  <span className="text-[12px] text-[#aaa]">Commandez plus rapidement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </PublicLayout>
  );
}
