import React from "react";
import CommunesClient from "./CommunesClient";
import { getCommunes } from "@/modules/settings/actions";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function CommunesPage() {
  const communes = await getCommunes();
  return (
    <>
      <Topbar title="Configuration" subtitle="communes & zones" />
      <CommunesClient communes={communes} />
    </>
  );
}
