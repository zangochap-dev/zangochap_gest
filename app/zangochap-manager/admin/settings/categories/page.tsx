import React from "react";
import CategoriesClient from "./CategoriesClient";
import { getCategories } from "@/modules/settings/actions";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();
  
  return (
    <>
      <Topbar title="Configuration" subtitle="catégories" />
      <CategoriesClient categories={categories} />
    </>
  );
}
