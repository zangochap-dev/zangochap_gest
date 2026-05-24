import prisma from "./prisma";

export interface CartItem {
  productId?: string;
  price: number;
  qty: number;
  categoryId?: string;
}

export async function getBestAutomaticDiscount(
  cart: CartItem[],
  customerPhone?: string,
  customerId?: string
) {
  const now = new Date();

  // 0. Enrich cart items with categoryId if missing
  const productIdsToFetch = cart.filter(i => i.productId && !i.categoryId).map(i => i.productId!);
  if (productIdsToFetch.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIdsToFetch } },
      select: { id: true, categoryId: true }
    });
    const categoryMap = new Map(products.map(p => [p.id, p.categoryId]));
    cart.forEach(item => {
      if (item.productId && !item.categoryId) {
        item.categoryId = categoryMap.get(item.productId) || undefined;
      }
    });
  }
  
  // Fetch all active automatic promos
  const automaticPromos = await prisma.promoCode.findMany({
    where: {
      isActive: true,
      isAutomatic: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ]
    },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } }
    }
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  let bestPromo = null;
  let bestVirtualAmount = 0;

  // Batch query promo usage counts to avoid N+1 query problem
  const promosWithGlobalLimits = automaticPromos.filter(p => p.maxGlobalUses !== null).map(p => p.code);
  const usageCounts = new Map<string, number>();
  if (promosWithGlobalLimits.length > 0) {
    const counts = await prisma.promoUsage.groupBy({
      by: ['promoCode'],
      where: { promoCode: { in: promosWithGlobalLimits } },
      _count: true
    });
    counts.forEach(c => usageCounts.set(c.promoCode, c._count));
  }

  for (const promo of automaticPromos) {
    // 1. Check Global Usage Limit
    if (promo.maxGlobalUses !== null) {
      const usageCount = usageCounts.get(promo.code) || 0;
      if (usageCount >= promo.maxGlobalUses) continue;
    }

    // 1b. Check Phone limit (ONCE_PER_PHONE)
    if (promo.rule === 'ONCE_PER_PHONE' && customerPhone) {
      const cleanPhone = customerPhone.replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.length >= 8) {
        const suffix = cleanPhone.substring(cleanPhone.length - 8);
        const phoneUsage = await prisma.promoUsage.findFirst({
          where: {
            promoCode: promo.code,
            customerPhone: { contains: suffix }
          }
        });
        if (phoneUsage) continue;
      }
    }

    // 1c. Check Customer limit (ONCE_PER_CUSTOMER)
    if (promo.rule === 'ONCE_PER_CUSTOMER' && customerId) {
      const customerUsage = await prisma.order.findFirst({
        where: {
          customerId: customerId,
          promoCode: promo.code
        }
      });
      if (customerUsage) continue;
    }

    // 2. Check Min Amount
    if (cartTotal < promo.minAmount) continue;

    // 3. Check Min Quantity
    if (cartQty < promo.minQuantity) continue;

    // 4. Check Product/Category Restrictions
    const hasProductRestrictions = promo.products.length > 0;
    const hasCategoryRestrictions = promo.categories.length > 0;

    let applicableTotal = 0;
    if (!hasProductRestrictions && !hasCategoryRestrictions) {
      applicableTotal = cartTotal;
    } else {
      // If restricted, only count items that match
      const promoProductIds = new Set(promo.products.map(p => p.id));
      const promoCategoryIds = new Set(promo.categories.map(c => c.id));

      applicableTotal = cart.reduce((sum, item) => {
        const matchesProduct = item.productId && promoProductIds.has(item.productId);
        const matchesCategory = item.categoryId && promoCategoryIds.has(item.categoryId);
        
        if (matchesProduct || matchesCategory) {
          return sum + item.price * item.qty;
        }
        return sum;
      }, 0);
    }

    if (applicableTotal === 0) continue;

    // 5. Calculate Discount
    let discountAmount = 0;
    if (promo.type === 'PERCENT') {
      discountAmount = Math.floor(applicableTotal * (promo.value / 100));
    } else if (promo.type === 'FIXED') {
      discountAmount = promo.value;
    } else if (promo.type === 'GIFT' && promo.giftProductId) {
      const giftProduct = await prisma.product.findUnique({
        where: { id: promo.giftProductId },
        select: { price: true }
      });
      if (giftProduct) {
        discountAmount = Number(giftProduct.price);
      }
    }

    if (discountAmount > bestVirtualAmount || (promo.type === 'GIFT' && promo.giftProductId && bestPromo === null)) {
      bestPromo = promo;
      bestVirtualAmount = discountAmount;
    }
  }

  if (bestPromo) {
    return {
      code: bestPromo.code,
      amount: bestPromo.type === 'GIFT' ? 0 : bestVirtualAmount,
      label: bestPromo.label || bestPromo.code,
      type: bestPromo.type,
      giftProductId: bestPromo.giftProductId
    };
  }

  return {
    code: null,
    amount: 0,
    label: null,
    type: null,
    giftProductId: null
  };
}

export async function validatePromoCode(
  code: string,
  cart: CartItem[],
  customerPhone?: string,
  customerId?: string
) {
  const now = new Date();
  const trimmedCode = code.trim();

  // Find promo code (case-insensitive)
  const promo = await prisma.promoCode.findFirst({
    where: {
      code: {
        equals: trimmedCode,
        mode: 'insensitive'
      },
      isActive: true
    },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } }
    }
  });

  if (!promo) {
    return {
      success: false,
      error: "Ce code promo n'existe pas ou n'est pas actif."
    };
  }

  // 1. Check Date Range
  if (promo.startDate && promo.startDate > now) {
    return { success: false, error: "Ce code promo n'est pas encore valide." };
  }
  if (promo.endDate && promo.endDate < now) {
    return { success: false, error: "Ce code promo a expiré." };
  }

  // 2. Check Global Usage Limit
  if (promo.maxGlobalUses !== null) {
    const usageCount = await prisma.promoUsage.count({
      where: { promoCode: promo.code }
    });
    if (usageCount >= promo.maxGlobalUses) {
      return { success: false, error: "La limite d'utilisation globale de ce code promo a été atteinte." };
    }
  }

  // 3. Check Phone limit (ONCE_PER_PHONE)
  if (promo.rule === 'ONCE_PER_PHONE' && customerPhone) {
    const cleanPhone = customerPhone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.length >= 8) {
      const suffix = cleanPhone.substring(cleanPhone.length - 8);
      const phoneUsage = await prisma.promoUsage.findFirst({
        where: {
          promoCode: promo.code,
          customerPhone: { contains: suffix }
        }
      });
      if (phoneUsage) {
        return { success: false, error: "Ce code promo a déjà été utilisé avec ce numéro de téléphone." };
      }
    }
  }

  // 4. Check Customer limit (ONCE_PER_CUSTOMER)
  if (promo.rule === 'ONCE_PER_CUSTOMER' && customerId) {
    const customerUsage = await prisma.order.findFirst({
      where: {
        customerId: customerId,
        promoCode: promo.code
      }
    });
    if (customerUsage) {
      return { success: false, error: "Ce code promo a déjà été utilisé par ce client." };
    }
  }

  // 5. Enrich cart items with categoryId if missing
  const productIdsToFetch = cart.filter(i => i.productId && !i.categoryId).map(i => i.productId!);
  if (productIdsToFetch.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIdsToFetch } },
      select: { id: true, categoryId: true }
    });
    const categoryMap = new Map(products.map(p => [p.id, p.categoryId]));
    cart.forEach(item => {
      if (item.productId && !item.categoryId) {
        item.categoryId = categoryMap.get(item.productId) || undefined;
      }
    });
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // 6. Check Min Amount
  if (cartTotal < promo.minAmount) {
    return { success: false, error: `Ce code promo nécessite un montant minimum d'achat de ${promo.minAmount} FCFA.` };
  }

  // 7. Check Min Quantity
  if (cartQty < promo.minQuantity) {
    return { success: false, error: `Ce code promo nécessite au moins ${promo.minQuantity} articles dans le panier.` };
  }

  // 8. Check Product/Category Restrictions
  const hasProductRestrictions = promo.products.length > 0;
  const hasCategoryRestrictions = promo.categories.length > 0;

  let applicableTotal = 0;
  if (!hasProductRestrictions && !hasCategoryRestrictions) {
    applicableTotal = cartTotal;
  } else {
    // If restricted, only count items that match
    const promoProductIds = new Set(promo.products.map(p => p.id));
    const promoCategoryIds = new Set(promo.categories.map(c => c.id));

    applicableTotal = cart.reduce((sum, item) => {
      const matchesProduct = item.productId && promoProductIds.has(item.productId);
      const matchesCategory = item.categoryId && promoCategoryIds.has(item.categoryId);
      
      if (matchesProduct || matchesCategory) {
        return sum + item.price * item.qty;
      }
      return sum;
    }, 0);
  }

  if (applicableTotal === 0) {
    return { success: false, error: "Ce code promo ne s'applique à aucun article dans votre panier." };
  }

  // 9. Calculate Discount
  let discountAmount = 0;
  if (promo.type === 'PERCENT') {
    discountAmount = Math.floor(applicableTotal * (promo.value / 100));
  } else if (promo.type === 'FIXED') {
    discountAmount = promo.value;
  } else if (promo.type === 'GIFT' && promo.giftProductId) {
    const giftProduct = await prisma.product.findUnique({
      where: { id: promo.giftProductId },
      select: { price: true }
    });
    if (giftProduct) {
      discountAmount = Number(giftProduct.price);
    }
  }

  return {
    success: true,
    discount: {
      code: promo.code,
      amount: promo.type === 'GIFT' ? 0 : discountAmount,
      label: promo.label || promo.code,
      type: promo.type,
      giftProductId: promo.giftProductId
    }
  };
}

