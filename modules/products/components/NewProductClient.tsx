"use client";

import React, { useTransition } from "react";
import { useToast } from "@/components/Toast";
import { createProduct } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import ProductForm from "@/modules/products/components/ProductForm";
import { reloadOnStaleServerAction } from "@/lib/stale-server-action";

export default function NewProductClient({ warehouses, categories, suppliers = [] }: { warehouses: any[], categories: any[], suppliers?: any[] }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    startTransition(async () => {
      try {
        await createProduct(formData);
        showToast("Produit ajouté avec succès ✓", "success");
        router.push("/zangochap-manager/products");
      } catch (err: any) {
        if (reloadOnStaleServerAction(err)) return;
        showToast(err.message || "Erreur lors de l'ajout", "error");
      }
    });
  };

  return (
    <ProductForm 
      title="Nouveau produit"
      warehouses={warehouses}
      categories={categories}
      suppliers={suppliers}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      isPending={isPending}
    />
  );
}
