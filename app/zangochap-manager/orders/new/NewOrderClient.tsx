"use client";

import React, { useState, useMemo, useCallback, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/Toast";
import { createOrder, getOrder } from "@/modules/orders/actions";
import { getAutomaticDiscountAction } from "@/modules/products/actions";
import { COMMUNES, formatPrice, DELIVERY_FEES } from "@/lib/constants";
import { getCustomers } from "@/modules/crm/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ShoppingCart, User, Plus, Minus, Trash2, CreditCard, Filter, RotateCcw, Info, Check, Maximize, Sparkles, RotateCw, Package, ArrowLeft, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import VariantSelectionModal from "@/components/VariantSelectionModal";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import Modal from "@/components/Modal";
import ReceiptModal from "@/components/ReceiptModal";

interface NewOrderClientProps {
  products: any[];
  user: any;
  categories: any[];
}

export default function NewOrderClient({ products, user, categories }: NewOrderClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Nombre de produits par page

  // Promo State
  const [discount, setDiscount] = useState<{ code: string | null, amount: number, label: string | null }>({
    code: null,
    amount: 0,
    label: null
  });

  // Calculate automatic discount
  useEffect(() => {
    if (items.length > 0) {
      const fetchDiscount = async () => {
        const res = await getAutomaticDiscountAction(items.map(item => ({
          productId: item.productId,
          price: item.price,
          qty: item.qty
        })));
        setDiscount(res);
      };
      fetchDiscount();
    } else {
      setDiscount({ code: null, amount: 0, label: null });
    }
  }, [items]);

  // Customer State
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [commune, setCommune] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [orderType, setOrderType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);

  const getDefaultDeliveryDate = () => {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 1);

    // 0 is Sunday, 6 is Saturday. If tomorrow is Sunday, move to Monday.
    if (target.getDay() === 0) {
      target.setDate(target.getDate() + 1);
    }

    return target.toISOString().split('T')[0];
  };

  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');

  const searchParams = useSearchParams();

  // Handle URL Pre-fill (Redirection from Exchange)
  useEffect(() => {
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const communeVal = searchParams.get('commune');
    const loc = searchParams.get('loc');
    const duplicateId = searchParams.get('duplicate');

    if (name) setCustomerName(name);
    if (phone) setCustomerPhone(phone);
    if (communeVal) setCommune(communeVal);
    if (loc) setCustomerLocation(loc);
    if (type) {
      setOrderType(type);
      setDeliveryNote(`[${type.toUpperCase()}] Commande originale : ${duplicateId || '?'}`);
    }

    if (duplicateId) {
      getOrder(duplicateId).then(order => {
        if (order && order.items) {
          setItems(order.items.map((i: any) => ({
            id: i.productId || Math.random().toString(),
            productId: i.productId,
            name: i.name,
            price: Number(i.price),
            qty: i.qty,
            size: i.size,
            color: i.color,
            emoji: i.emoji || '📦',
            isCustom: i.isCustom,
            image: i.image
          })));
        }
      });
    }
  }, [searchParams]);

  // CRM Search Logic
  useEffect(() => {
    const query = customerName.length >= 3 ? customerName : '';
    if (!query) {
      setCustomerSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await getCustomers(query);
        // Avoid showing if user already filled or query changed
        setCustomerSuggestions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customerName]);

  const selectCustomer = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    if (c.phone2) setCustomerPhone2(c.phone2);
    if (c.location) setCustomerLocation(c.location);
    if (c.commune) {
      setCommune(c.commune);
      if (DELIVERY_FEES[c.commune]) setDeliveryFee(DELIVERY_FEES[c.commune]);
    }
    setCustomerSuggestions([]);
  };

  // Custom Item State
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customSize, setCustomSize] = useState('Standard');
  const [customColor, setCustomColor] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Variant Selection State
  const [selectingProduct, setSelectingProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [modalQty, setModalQty] = useState(1);

  // Global & Modal Filters
  const [sizeFilter, setSizeFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.variants?.forEach((v: any) => sizes.add(v.size)));
    return Array.from(sizes).sort();
  }, [products]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.variants?.forEach((v: any) => colors.add(v.color)));
    return Array.from(colors).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerms = search.toLowerCase().trim().split(/\s+/);

    return products.filter(p => {
      const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory || p.category?.name === activeCategory;

      if (!matchesCat) return false;
      if (!search) return true;

      // Search across name, supplier, ref, and variants
      const productName = (p.name || '').toLowerCase();
      const productSupplier = (p.supplier?.name || '').toLowerCase();
      const productRef = (p.ref || '').toLowerCase();
      const variantMatches = p.variants?.some((v: any) =>
        (v.size || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.color || '').toLowerCase().includes(search.toLowerCase())
      );

      // Multi-word matching: ALL search terms must match somewhere in the product
      return searchTerms.every(term =>
        productName.includes(term) ||
        productSupplier.includes(term) ||
        productRef.includes(term) ||
        variantMatches
      );
    });
  }, [products, activeCategory, search]);

  // Reset pagination when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const productVariantsBySize = useMemo(() => {
    if (!selectingProduct) return {};
    const grouped: Record<string, any[]> = {};
    selectingProduct.variants.forEach((v: any) => {
      if (!grouped[v.size]) grouped[v.size] = [];
      grouped[v.size].push(v);
    });
    return grouped;
  }, [selectingProduct]);

  const handleAddToCartFromModal = () => {
    if (!selectingProduct || !selectedVariant) return;

    const existingIdx = items.findIndex(i =>
      i.productId === selectingProduct.id &&
      i.size === selectedVariant.size &&
      i.color === selectedVariant.color
    );

    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].qty += modalQty;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: selectingProduct.id,
        name: selectingProduct.name,
        price: Number(selectingProduct.price),
        qty: Number(modalQty),
        size: selectedVariant.size,
        color: selectedVariant.color,
        emoji: selectingProduct.emoji || '📦',
        image: getImageUrl(selectingProduct.images?.[0]?.dataUrl || selectingProduct.images?.[0]?.url)
      }]);
    }
    showToast(`${selectingProduct.name} ajouté`, 'success');
    setSelectingProduct(null);
    setSelectedVariant(null);
    setModalQty(1);
  };

  const handleDirectAdd = (product: any, variant: any) => {
    const existingIdx = items.findIndex(i =>
      i.productId === product.id &&
      i.size === variant.size &&
      i.color === variant.color
    );

    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].qty += 1;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        qty: 1,
        size: variant.size,
        color: variant.color,
        emoji: product.emoji || '📦',
        image: getImageUrl(product.images?.[0]?.dataUrl || product.images?.[0]?.url)
      }]);
    }
    showToast(`${product.name} (${variant.size}/${variant.color}) ajouté ✓`, 'success');
  };

  const addToCartDirect = (product: any) => {
    const existingIdx = items.findIndex(i => i.productId === product.id);
    if (existingIdx > -1) {
      const newItems = [...items];
      newItems[existingIdx].qty += 1;
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        qty: 1,
        size: '',
        color: '',
        emoji: product.emoji || '📦',
        image: getImageUrl(product.images?.[0]?.dataUrl || product.images?.[0]?.url)
      }]);
    }
    showToast(`${product.name} ajouté`, 'success');
  };

  const handleAddCustomItem = () => {
    if (!customName || !customPrice) {
      showToast('Nom et prix requis', 'error');
      return;
    }
    setItems(prev => [...prev, {
      productId: 'custom_' + Date.now(),
      name: customName,
      price: parseInt(customPrice),
      qty: parseInt(customQty) || 1,
      size: customSize || 'Standard',
      color: customColor || 'Standard',
      emoji: '✨',
      image: customImage || undefined,
      isCustom: true,
      desc: customDesc,
    }]);
    showToast('Article personnalisé ajouté', 'success');
    setShowCustomItem(false);
    setCustomName(''); setCustomPrice(''); setCustomQty('1');
    setCustomSize('Standard'); setCustomColor(''); setCustomDesc(''); setCustomImage('');
  };

  const updateQty = (idx: number, delta: number) => {
    const newItems = [...items];
    const newQty = newItems[idx].qty + delta;
    if (newQty <= 0) {
      newItems.splice(idx, 1);
    } else {
      newItems[idx].qty = newQty;
    }
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handlePrint = (order: any, format: 'a4' | 'a6' | 'thermal') => {
    const url = `/api/orders/${order.id}/receipt?format=${format}`;
    window.open(url, '_blank', 'width=800,height=900');
  };

  const handleWhatsApp = (order: any) => {
    const phone = order.customerPhone.replace(/\s+/g, '');
    const names = (order.customerName || "").trim().split(/\s+/);
    const lastName = names[0] || "";
    const firstName = names.slice(1).join(" ") || "—";
    const totalAmount = Number(order.total || 0) + Number(order.deliveryFee || 0);

    const itemsList = order.items.map((i: any) => `${i.name} (${i.size}/${i.color}) x${i.qty}`).join("\n");

    const msg = `🎉 *Votre commande est validée !*
Veuillez vérifier vos informations enregistrées pour la commande
Nom: ${lastName}
Prenom: ${firstName}

Numéro joignable 1: ${order.customerPhone}

Numéro joignable 2 : ${order.customerPhone2 || '—'}

Lieu de livraison : ${order.customerLocation} (${order.commune})

Nom du produit : 
${itemsList}

Prix total: ${totalAmount.toLocaleString('fr-FR')} FCFA

1️⃣ Téléchargez l’application dès maintenant en cliquant ici 👇🏾:
📲 *Android* : https://play.google.com/store/apps/details?id=com.zangochap.zangochap&pcampaignid=web_share

🍏 iPhone : https://apps.apple.com/ci/app/zangochap/id6737241287

2️⃣ Envoyez-nous une capture d’écran de l’application installée pour activer votre surprise .

Ne passez pas à côté de cette belle surprise ! 😍🔥`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadPDF = (order: any) => {
    const url = `/api/orders/${order.id}/receipt?format=a4&download=true`;
    window.location.href = url;
  };

  const handleFinalSubmit = () => {
    if (!customerName || !customerPhone || !commune) {
      showToast('Nom, téléphone et commune requis', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const finalPaymentMethod = paymentMethod === 'Autres' ? customPaymentMethod : paymentMethod;

        // Validation for Hors Abidjan
        if (commune === 'Hors Abidjan' && !finalPaymentMethod) {
          showToast('Veuillez préciser le mode de règlement pour une expédition', 'error');
          return;
        }

        const order = await createOrder({
          customerId: customerId || undefined,
          customerName,
          customerPhone,
          customerPhone2,
          customerLocation,
          commune,
          deliveryFee,
          deliveryNote,
          items,
          type: orderType || undefined,
          deliveryDate,
          paymentMethod: finalPaymentMethod || undefined,
          promoCode: discount.code || undefined,
          discount: discount.amount,
        });
        showToast('Commande créée ✓', 'success');
        setReceiptOrder(order);
        // We don't redirect immediately so user can print
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  return (
    <div className="pos-container animate-fade-in">
      {/* HEADER / NAVIGATION */}
      <header className="pos-header">
        <div className="pos-header-left">
          <Link href="/zangochap-manager/orders" className="pos-back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>{orderType === 'Echange' ? 'Échange de produit' : 'Nouvelle Vente'}</h1>
            <p>{orderType === 'Echange' ? 'Sélectionnez les nouveaux articles' : 'Point de Vente Zangochap'}</p>
          </div>
        </div>

        {orderType === 'Echange' && (
          <div style={{ background: 'var(--orange-soft)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--orange)', color: 'var(--orange)', fontWeight: 700, fontSize: 13 }}>
            <RotateCcw size={16} />
            MODE ÉCHANGE ACTIVÉ : Les informations client sont déjà remplies.
          </div>
        )}

        <button className="pos-custom-item-btn" onClick={() => setShowCustomItem(true)}>
          <Sparkles size={16} />
          Article personnalisé
        </button>

        <div className="pos-search-wrapper">
          <Search className="pos-search-icon" size={18} />
          <input
            className="pos-search-input"
            placeholder="Scanner ou rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="pos-search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>

        <div className="pos-header-right">
          <div className="pos-user-badge">
            <div className="pos-user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <span>{user?.name || 'Vendeur'}</span>
          </div>
        </div>
      </header>

      <main className="pos-main">
        {/* LEFT PANEL: PRODUCT CATALOG */}
        <section className="pos-catalog">
          <nav className="pos-categories">
            <button
              className={`pos-cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`pos-cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          <div className="pos-product-grid">
            {paginatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onPreview={(img) => setPreviewImage(img)}
                onAdd={(p) => {
                  if (p.variants?.length > 0) {
                    setSizeFilter('all');
                    setColorFilter('all');
                    setSelectingProduct(p);
                  } else {
                    addToCartDirect(p);
                  }
                }}
              />
            ))}
            {paginatedProducts.length === 0 && (
              <div className="pos-empty-catalog">
                <Package size={48} />
                <p>Aucun produit trouvé</p>
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 py-4 border-t border-[#E8DDD0]">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-[#E8DDD0] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#D4541C] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1410]">Page</span>
                <div className="px-3 py-1 bg-[#D4541C] text-white rounded-md font-bold text-sm">
                  {currentPage}
                </div>
                <span className="text-sm font-bold text-[#1A1410]">sur {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-[#E8DDD0] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#D4541C] transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>

        {/* RIGHT PANEL: CART */}
        <aside className="pos-sidebar">
          <div className="pos-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingCart size={20} />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Panier</h2>
            </div>
            <span className="pos-cart-count">{items.length} articles</span>
          </div>

          {/* CUSTOMER SELECTOR */}
          <div className="pos-sidebar-customer">
            {customerName ? (
              <div className="pos-selected-customer">
                <div className="pos-customer-info">
                  <div className="pos-customer-name">{customerName}</div>
                  <div className="pos-customer-phone">{customerPhone}</div>
                </div>
                <button className="pos-customer-remove" onClick={() => { setCustomerId(null); setCustomerName(''); setCustomerPhone(''); setCustomerPhone2(''); setCustomerLocation(''); setCommune(''); setDeliveryFee(0); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button className="pos-select-customer-btn" onClick={() => setShowCheckout(true)}>
                <User size={16} />
                <span>Identifier le client</span>
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="pos-cart-items">
            {items.length === 0 ? (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon">🛒</div>
                <p>Votre panier est vide</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="pos-cart-item">
                  <div className="pos-cart-item-main">
                    <div
                      className="pos-cart-item-img"
                      onClick={() => item.image && setPreviewImage(item.image)}
                      style={item.image ? { cursor: 'zoom-in' } : undefined}
                      title={item.image ? "Voir en grand" : ""}
                    >
                      {item.image ? (<img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<span style={{ fontSize: 20 }}>{item.emoji}</span>)}
                    </div>
                    <div className="pos-cart-item-info">
                      <div className="pos-cart-item-name">
                        {item.name}
                        {item.isCustom && <span style={{ marginLeft: 6, background: 'var(--blue)', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' as const }}>Perso</span>}
                      </div>
                      <div className="pos-cart-item-meta">{item.size} · {item.color}</div>
                      <div className="pos-cart-item-price">{formatPrice(item.price)}</div>
                    </div>
                  </div>
                  <div className="pos-cart-item-actions">
                    <div className="pos-qty-control">
                      <button onClick={() => updateQty(idx, -1)}><Minus size={14} /></button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(idx, 1)}><Plus size={14} /></button>
                    </div>
                    <button className="pos-item-remove" onClick={() => updateQty(idx, -999)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-footer">
            <div className="pos-summary-row">
              <span>Sous-total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="pos-summary-row">
              <span>Livraison</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            {discount.amount > 0 && (
              <div className="pos-summary-row" style={{ color: 'var(--orange)', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={12} /> {discount.label || 'Remise auto.'}
                </span>
                <span>-{formatPrice(discount.amount)}</span>
              </div>
            )}
            <div className="pos-summary-total">
              <span>Total à payer</span>
              <span>{formatPrice(Math.max(0, total + deliveryFee - discount.amount))}</span>
            </div>

            <button
              className="pos-checkout-btn"
              disabled={items.length === 0}
              onClick={() => setShowCheckout(true)}
            >
              <CreditCard size={18} />
              Valider la commande
            </button>
          </div>
        </aside>
      </main>

      {previewImage && createPortal(
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }}
        >
          <div className="lightbox-content animate-zoom-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
            <button
              className="lightbox-close"
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: -40, right: 0, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* VARIANT SELECTION MODAL */}
      <VariantSelectionModal
        product={selectingProduct}
        onClose={() => setSelectingProduct(null)}
        onAdd={handleAddToCartFromModal}
        sizeFilter={sizeFilter}
        setSizeFilter={setSizeFilter}
        colorFilter={colorFilter}
        setColorFilter={setColorFilter}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
        modalQty={modalQty}
        setModalQty={setModalQty}
        setPreviewImage={setPreviewImage}
      />

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <Modal
          isOpen={true}
          onClose={() => setShowCheckout(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={20} /> Informations Client
            </div>
          }
          large
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowCheckout(false)}>Retour au panier</button>
              <button className="btn-orange" onClick={handleFinalSubmit} disabled={isPending}>
                {isPending ? 'Traitement...' : 'Confirmer la Vente'}
              </button>
            </>
          }
        >
          <div className="pos-checkout-grid">
            <div className="pos-checkout-form">
              <div className="form-grid full" style={{ gap: 16 }}>
                <div className="form-row" style={{ position: 'relative' }}>
                  <label className="field-label-sm">NOM DU CLIENT</label>
                  <input className="field-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex. Aminata Diabaté" />

                  {customerSuggestions.length > 0 && (
                    <div className="crm-suggestions">
                      {customerSuggestions.map(c => (
                        <div key={c.id} className="crm-suggestion-item" onClick={() => selectCustomer(c)}>
                          <div className="sug-name">{c.name}</div>
                          <div className="sug-phone">{c.phone} · {c.commune || 'Sans commune'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-row" style={{ position: 'relative' }}>
                  <label className="field-label-sm">TÉLÉPHONE</label>
                  <input className="field-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07 07 07 07 07" autoComplete="off" />


                </div>
                <div className="form-row">
                  <label className="field-label-sm">TÉLÉPHONE SECONDAIRE</label>
                  <input className="field-input" value={customerPhone2} onChange={e => setCustomerPhone2(e.target.value)} placeholder="Facultatif" />
                </div>
                <div className="form-row">
                  <label className="field-label-sm">COMMUNE</label>
                  <select className="field-input" value={commune} onChange={e => {
                    const val = e.target.value;
                    setCommune(val);
                    if (val && DELIVERY_FEES[val]) {
                      setDeliveryFee(DELIVERY_FEES[val]);
                    }
                  }}>
                    <option value="">Choisir...</option>
                    {Object.entries(COMMUNES).map(([name, prefix]) => (
                      <option key={name} value={name}>{name} ({prefix as string})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label className="field-label-sm">ADRESSE DE LIVRAISON</label>
                  <textarea className="field-input" style={{ minHeight: 70 }} value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} placeholder="Quartier, rue, repère..." />
                </div>
                <div className="form-row">
                  <label className="field-label-sm">FRAIS DE LIVRAISON (FCFA)</label>
                  <input className="field-input" type="number" value={deliveryFee} onChange={e => setDeliveryFee(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-row">
                  <label className="field-label-sm">NOTE LIVRAISON</label>
                  <input className="field-input" value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="Ex. Appeler avant de venir" />
                </div>

                {commune === 'Hors Abidjan' && (
                  <>
                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label-sm" style={{ color: 'var(--orange)', fontWeight: 800 }}>SOLDER PAR (OBLIGATOIRE) *</label>
                      <select className="field-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ border: '2.5px solid var(--orange-soft)', fontWeight: 800 }}>
                        <option value="">Sélectionner le mode de règlement...</option>
                        <option value="MTN Money">MTN Money</option>
                        <option value="Orange Money">Orange Money</option>
                        <option value="Moov Money">Moov Money</option>
                        <option value="Wave">Wave</option>
                        <option value="Virement">Virement bancaire</option>
                        <option value="Autres">Autres (Préciser)</option>
                      </select>
                    </div>
                    {paymentMethod === 'Autres' && (
                      <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                        <label className="field-label-sm">PRÉCISER LE MODE DE RÈGLEMENT</label>
                        <input className="field-input" value={customPaymentMethod} onChange={e => setCustomPaymentMethod(e.target.value)} placeholder="Ex. Western Union, Ria..." />
                      </div>
                    )}
                  </>
                )}
                <div className="form-row">
                  <label className="field-label-sm" style={{ color: 'var(--orange)', fontWeight: 700 }}>DATE DE LIVRAISON PRÉVUE</label>
                  <input
                    type="date"
                    className="field-input"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    style={{ border: '1.5px solid var(--orange-soft)', fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 4 }}>
                    Par défaut : Demain (ou Lundi si on est samedi).
                  </div>
                </div>
              </div>
            </div>
            <div className="pos-checkout-summary">
              <h3>Résumé de la vente</h3>
              <div className="pos-checkout-items-mini">
                {items.map((i, idx) => (
                  <div key={idx} className="pos-mini-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--cream-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i.image ? <img src={i.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{i.emoji || '📦'}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--brown-soft)' }}>{i.qty} × {i.size} · {i.color}</div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{formatPrice(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="pos-mini-totals">
                <div className="mini-row"><span>Articles</span> <span>{formatPrice(total)}</span></div>
                <div className="mini-row"><span>Livraison</span> <span>{formatPrice(deliveryFee)}</span></div>
                {discount.amount > 0 && (
                  <div className="mini-row" style={{ color: 'var(--orange)', fontWeight: 600 }}>
                    <span>Remise ({discount.label})</span>
                    <span>-{formatPrice(discount.amount)}</span>
                  </div>
                )}
                <div className="mini-row total"><span>Total</span> <span>{formatPrice(Math.max(0, total + deliveryFee - discount.amount))}</span></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CUSTOM ITEM MODAL */}
      {showCustomItem && (
        <Modal
          isOpen={true}
          onClose={() => setShowCustomItem(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} /> Article personnalisé
            </div>
          }
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowCustomItem(false)}>Annuler</button>
              <button className="btn-orange" onClick={handleAddCustomItem}>Ajouter à la commande</button>
            </>
          }
        >
          <div style={{ background: 'var(--blue-soft)', borderLeft: '3px solid var(--blue)', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--brown)' }}>
            Pour les articles non encore ajoutés au catalogue. L'article sera attaché uniquement à cette commande.
          </div>
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label-sm">NOM DU PRODUIT *</label>
              <input className="field-input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ex. Veste sur mesure rouge" />
            </div>
            <div className="form-row">
              <label className="field-label-sm">PRIX UNITAIRE (FCFA) *</label>
              <input className="field-input" type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="15000" />
            </div>
            <div className="form-row">
              <label className="field-label-sm">QUANTITÉ</label>
              <input className="field-input" type="number" min="1" value={customQty} onChange={e => setCustomQty(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="field-label-sm">TAILLE</label>
              <input className="field-input" value={customSize} onChange={e => setCustomSize(e.target.value)} placeholder="Ex. M ou Standard" />
            </div>
            <div className="form-row">
              <label className="field-label-sm">COULEUR</label>
              <input className="field-input" value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder="Ex. Rouge bordeaux" />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label-sm">DESCRIPTION (optionnel)</label>
              <textarea className="field-input" value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Détails, notes pour l'emballage..." style={{ minHeight: 60 }} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label-sm">IMAGE (facultatif)</label>
              <div
                onClick={() => document.getElementById('customImageInput')?.click()}
                style={{ border: '2px dashed var(--line)', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: 'var(--cream)' }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
                <div style={{ fontWeight: 600, color: 'var(--brown)', fontSize: 12 }}>Cliquer pour ajouter une image</div>
                <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 2 }}>JPG, PNG — facultatif</div>
              </div>
              <input
                type="file"
                id="customImageInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setCustomImage(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {customImage && (
                <div style={{ marginTop: 10, position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <img
                    src={customImage}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                    onClick={() => setPreviewImage(customImage)}
                    title="Voir en grand"
                  />
                  <button
                    onClick={() => setCustomImage('')}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => {
            setReceiptOrder(null);
            router.push('/zangochap-manager/orders');
          }}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onWhatsApp={handleWhatsApp}
        />
      )}
    </div>
  );
}


