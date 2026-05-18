# App Directory Conventions

`app/` is the routing layer. It should stay thin.

## What Belongs Here

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- route handlers under `app/api`
- route-specific metadata
- route composition: load page data, render the module component
- tiny route wrappers around module components

## What Does Not Belong Here

- large client screens
- reusable domain components
- business rules
- validation schemas
- Prisma-heavy query builders
- stock, order, promo, CRM, logistics, or settings workflows

Move those into `modules/<domain>`.

## Page Pattern

Preferred shape:

```tsx
import Screen from "@/modules/<domain>/<feature>/Screen";
import { getScreenData } from "@/modules/<domain>/<feature>/actions";

export default async function Page() {
  const data = await getScreenData();
  return <Screen {...data} />;
}
```

## Client Component Pattern

If a client component is more than a small local wrapper, place it in a module:

```text
modules/orders/components/OrdersClient.tsx
modules/products/components/ProductsClient.tsx
modules/logistics/collection/CollectionClient.tsx
```

Then import it from the page:

```tsx
import OrdersClient from "@/modules/orders/components/OrdersClient";
```

## Prisma Rule

Pages may temporarily call Prisma while migrating, but the target is:

- read/query logic in module actions or query helpers
- validation at module boundaries
- page receives already-shaped data

Avoid putting filters, role rules, or business calculations directly inside
`page.tsx`.

## Import Rule

Inside a route folder, local imports can be relative:

```tsx
import ShopClient from "./ShopClient";
```

Across domains, use module entrypoints:

```tsx
import ProductsClient from "@/modules/products/components/ProductsClient";
import { getWarehouses } from "@/modules/logistics/warehouses";
```

Never import from `@/app/...` unless there is a deliberate route-level reason.

## Migration Priority

Move screens out of `app/` in this order:

1. logistics screens
2. admin delivery and settlement screens
3. inventory screens
4. CRM and settings screens
5. public shop/cart/product screens
6. rider app screens
