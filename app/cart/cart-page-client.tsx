"use client";

import React, { useState, useTransition } from "react";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/constants";
import { Trash2, ShoppingBag, ArrowRight, MapPin, Phone, User, CheckCircle2, Minus, Plus, ShieldCheck, Truck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { createOrder } from "@/modules/orders/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function CartPageClient({ communes = [] }: { communes?: any[] }) {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");

  const selectedCommuneObj = communes.find(c => c.name === commune);
  const deliveryFee = selectedCommuneObj ? selectedCommuneObj.deliveryFee : 0;
  const grandTotal = total + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name || !phone || !commune || !address) {
      showToast("Veuillez remplir tous les champs de livraison", "error");
      return;
    }

    startTransition(async () => {
      try {
        await createOrder({
          customerName: name,
          customerPhone: phone,
          customerLocation: address,
          commune,
          deliveryFee,
          items: cart.map(item => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            color: item.color,
            qty: item.qty,
            price: item.price,
          }))
        });
        
        showToast("Commande validée avec succès !", "success");
        clearCart();
        setOrderSuccess(true);
      } catch (e: any) {
        showToast(e.message || "Erreur lors de la commande", "error");
      }
    });
  };

  if (orderSuccess) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon"><CheckCircle2 size={56} color="#2D8A4E" strokeWidth={1.5} /></div>
          <h1>COMMANDE CONFIRMÉE</h1>
          <p>Merci pour votre confiance. Notre équipe vous contactera dans les prochaines minutes pour organiser la livraison.</p>
          <Link href="/" className="success-btn">CONTINUER MES ACHATS</Link>
        </div>
        <style jsx>{`
          .success-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: 60px 24px; }
          .success-card { text-align: center; max-width: 460px; animation: fadeUp 0.5s ease; }
          .success-icon { margin-bottom: 28px; }
          .success-card h1 { font-size: 22px; font-weight: 300; letter-spacing: 0.2em; margin-bottom: 16px; color: #1A1614; }
          .success-card p { font-size: 14px; color: #888; line-height: 1.7; margin-bottom: 36px; }
          .success-btn { display: inline-block; padding: 16px 48px; background: #1A1614; color: white; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; transition: all 0.3s; }
          .success-btn:hover { background: #333; transform: translateY(-2px); }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-page">
        <ShoppingBag size={56} color="#ddd" strokeWidth={1.2} />
        <h1>VOTRE PANIER EST VIDE</h1>
        <p>Parcourez notre collection et trouvez la pièce parfaite.</p>
        <Link href="/" className="empty-btn">DÉCOUVRIR LA BOUTIQUE</Link>
        <style jsx>{`
          .empty-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; padding: 80px 24px; text-align: center; animation: fadeUp 0.5s ease; }
          .empty-page h1 { font-size: 20px; font-weight: 300; letter-spacing: 0.2em; margin: 24px 0 12px; color: #1A1614; }
          .empty-page p { font-size: 14px; color: #999; margin-bottom: 32px; }
          .empty-btn { display: inline-block; padding: 16px 48px; background: #1A1614; color: white; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; transition: all 0.3s; }
          .empty-btn:hover { background: #333; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-breadcrumb">
        <Link href="/"><ChevronLeft size={14} /> Continuer mes achats</Link>
      </div>
      <h1 className="cart-title">PANIER <span>({cart.length})</span></h1>

      <div className="cart-layout">
        {/* ═══ ITEMS ═══ */}
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.variantId} className="cart-item">
              <div className="item-img">
                {item.image ? <img src={item.image} alt="" /> : <span className="item-placeholder">Z</span>}
              </div>
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-variant">{item.size} · {item.color}</p>
                <p className="item-unit-price">{formatPrice(item.price)}</p>
              </div>
              <div className="item-qty">
                <span>Qté: {item.qty}</span>
              </div>
              <div className="item-total">{formatPrice(item.price * item.qty)}</div>
              <button className="item-remove" onClick={() => removeFromCart(item.variantId)} aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* ═══ CHECKOUT SIDEBAR ═══ */}
        <div className="checkout-panel">
          <h2>LIVRAISON</h2>
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="field">
              <label>NOM COMPLET</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Aminata Traoré" required />
            </div>
            <div className="field">
              <label>TÉLÉPHONE</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07 00 00 00 00" required />
            </div>
            <div className="field">
              <label>COMMUNE</label>
              <select value={commune} onChange={e => setCommune(e.target.value)} required>
                <option value="">Sélectionner</option>
                {communes.map(c => <option key={c.id} value={c.name}>{c.name} (+{c.deliveryFee.toLocaleString()} F)</option>)}
              </select>
            </div>
            <div className="field">
              <label>ADRESSE PRÉCISE</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Quartier, rue, repères..." rows={3} required />
            </div>

            <div className="summary">
              <div className="sum-row"><span>Sous-total</span><span>{formatPrice(total)}</span></div>
              <div className="sum-row"><span>Livraison</span><span>{deliveryFee > 0 ? formatPrice(deliveryFee) : '—'}</span></div>
              <div className="sum-row total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
            </div>

            <button className="checkout-btn" type="submit" disabled={isPending}>
              {isPending ? "TRAITEMENT..." : "CONFIRMER LA COMMANDE"}
              {!isPending && <ArrowRight size={16} />}
            </button>

            <div className="checkout-trust">
              <ShieldCheck size={14} /> Paiement sécurisé · Livraison suivie
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .cart-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 40px 80px;
          animation: fadeUp 0.4s ease;
        }
        .cart-breadcrumb { margin-bottom: 20px; }
        .cart-breadcrumb :global(a) {
          text-decoration: none;
          color: #999;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .cart-breadcrumb :global(a:hover) { color: #1A1614; }
        .cart-title {
          font-size: 24px;
          font-weight: 300;
          letter-spacing: 0.2em;
          color: #1A1614;
          margin-bottom: 40px;
        }
        .cart-title span { color: #bbb; }

        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 60px;
          align-items: start;
        }

        /* ITEMS */
        .cart-items { display: flex; flex-direction: column; gap: 0; }
        .cart-item {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 28px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .item-img {
          width: 90px; height: 110px;
          background: #F5F3EF;
          flex-shrink: 0;
          overflow: hidden;
        }
        .item-img img { width: 100%; height: 100%; object-fit: cover; }
        .item-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 100; color: #D5D0C8;
        }
        .item-details { flex: 1; }
        .item-details h3 {
          font-size: 14px;
          font-weight: 500;
          color: #1A1614;
          margin-bottom: 4px;
          letter-spacing: 0.02em;
        }
        .item-variant {
          font-size: 12px;
          color: #aaa;
          margin-bottom: 6px;
        }
        .item-unit-price {
          font-size: 13px;
          color: #888;
          font-weight: 500;
        }
        .item-qty {
          font-size: 12px;
          color: #888;
          font-weight: 500;
        }
        .item-total {
          font-size: 15px;
          font-weight: 600;
          color: #1A1614;
          min-width: 80px;
          text-align: right;
        }
        .item-remove {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: none;
          border: 1px solid #f0f0f0;
          cursor: pointer;
          color: #ccc;
          transition: all 0.2s;
        }
        .item-remove:hover {
          border-color: #C23616;
          color: #C23616;
        }

        /* CHECKOUT */
        .checkout-panel {
          background: #FAFAF8;
          padding: 36px;
          position: sticky;
          top: 100px;
          border: 1px solid #f0f0f0;
        }
        .checkout-panel h2 {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.2em;
          margin-bottom: 28px;
          color: #1A1614;
        }
        .checkout-form { display: flex; flex-direction: column; gap: 20px; }
        .field label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #999;
          margin-bottom: 8px;
        }
        .field input, .field select, .field textarea {
          width: 100%;
          padding: 13px 16px;
          border: 1px solid #e8e8e4;
          background: white;
          font-size: 14px;
          color: #1A1614;
          outline: none;
          transition: border-color 0.25s;
          font-family: inherit;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: #1A1614;
        }
        .field textarea { resize: vertical; }

        .summary {
          border-top: 1px solid #e8e8e4;
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sum-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #888;
          font-weight: 400;
        }
        .sum-row.total {
          font-size: 18px;
          font-weight: 600;
          color: #1A1614;
          padding-top: 12px;
          border-top: 1px solid #e8e8e4;
          margin-top: 4px;
        }

        .checkout-btn {
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
          transition: all 0.35s;
        }
        .checkout-btn:hover:not(:disabled) {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .checkout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .checkout-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #bbb;
          margin-top: 4px;
        }

        @media (max-width: 900px) {
          .cart-page { padding: 16px 20px 100px; }
          .cart-layout { grid-template-columns: 1fr; gap: 40px; }
          .cart-item { gap: 16px; }
          .item-img { width: 70px; height: 85px; }
          .item-qty { display: none; }
          .checkout-panel { position: static; }
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
