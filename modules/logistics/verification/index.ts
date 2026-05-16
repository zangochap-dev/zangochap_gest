// Direct imports are preferred over barrel exports for Next.js App Router compatibility.
// Import components directly from their files:
//   import VerificationClient from "@/modules/logistics/verification/VerificationClient"
//   import OrderCard from "@/modules/logistics/verification/OrderCard"
//   import ImageLightbox from "@/modules/logistics/verification/ImageLightbox"
//   import { useVerificationData } from "@/modules/logistics/verification/hooks"

export type { OrderWithItems, OrderItemWithProduct, PreviewItemData, ProductWithVariants } from "./types";
