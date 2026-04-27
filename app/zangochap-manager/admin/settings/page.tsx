import React from "react";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import Topbar from "@/components/Topbar";

export default async function SettingsHubPage() {
  const user = await getSession();
  if (user?.role !== 'admin') redirect("/zangochap-manager");

  return (
    <>
      <Topbar title="Configuration" subtitle="centre de contrôle" />
      <SettingsClient />
    </>
  );
}
