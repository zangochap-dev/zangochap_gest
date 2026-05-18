"use client";

import React, { useTransition } from "react";
import { useToast } from "@/components/Toast";
import { updateProduct } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import ProductForm from "@/modules/products/components/ProductForm";

export default function EditProductClient({ product, warehouses, categories, suppliers = [] }: { product: any, warehouses: any[], categories: any[], suppliers?: any[] }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    startTransition(async () => {
      try {
        await updateProduct(product.id, formData);
        showToast("Produit mis à jour avec succès ✓", "success");
        router.push("/zangochap-manager/products");
      } catch (err: any) {
        showToast(err.message || "Erreur lors de la mise à jour", "error");
      }
    });
  };

  return (
    <ProductForm 
      title={`Modifier · ${product.name}`}
      initialData={product}
      warehouses={warehouses}
      categories={categories}
      suppliers={suppliers}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      isPending={isPending}
    />
  );
}
