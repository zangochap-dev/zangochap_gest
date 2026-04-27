import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import TeamClient from "./TeamClient";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function SettingsTeamPage() {
  const user = await getSession();
  
  if (user?.role !== 'admin') {
    return <div className="content"><div className="empty"><h4>Accès refusé</h4></div></div>;
  }

  const accounts = await prisma.user.findMany({ orderBy: { name: 'asc' } });

  return (
    <>
      <Topbar title="Configuration" subtitle="équipe & accès" />
      <TeamClient accounts={JSON.parse(JSON.stringify(accounts))} currentUser={user} />
    </>
  );
}
