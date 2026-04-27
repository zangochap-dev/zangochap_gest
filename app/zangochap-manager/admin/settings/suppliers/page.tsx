import React from "react";
import SuppliersClient from "./SuppliersClient";
import { getSuppliers } from "@/modules/settings/actions";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return (
    <>
      <Topbar title="Configuration" subtitle="fournisseurs" />
      <SuppliersClient suppliers={suppliers} />
    </>
  );
}
