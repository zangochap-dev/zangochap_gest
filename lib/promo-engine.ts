import prisma from "./prisma";

export interface CartItem {
  productId?: string;
  price: number;
  qty: number;
  categoryId?: string;
}

export async function getBestAutomaticDiscount(cart: CartItem[]) {
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

  let bestDiscount = {
    code: null as string | null,
    amount: 0,
    label: null as string | null
  };

  for (const promo of automaticPromos) {
    // 1. Check Global Usage Limit
    if (promo.maxGlobalUses !== null) {
      const usageCount = await prisma.promoUsage.count({ where: { promoCode: promo.code } });
      if (usageCount >= promo.maxGlobalUses) continue;
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
    }

    if (discountAmount > bestDiscount.amount) {
      bestDiscount = {
        code: promo.code,
        amount: discountAmount,
        label: promo.label || promo.code
      };
    }
  }

  return bestDiscount;
}
