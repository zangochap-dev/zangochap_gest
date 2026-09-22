import { personnelSummary } from "@/modules/personnel/summary";
import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import TeamClient from "./TeamClient";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function SettingsTeamPage() {
  const user = await getSession();
  
  if (user?.role !== 'admin' && user?.role !== 'developer') {
    return <div className="content"><div className="empty"><h4>Accès refusé</h4></div></div>;
  }

  const where: any = {};
  if (user.role === 'admin') {
    where.role = { not: 'DEVELOPER' };
  }

  const accounts = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  // Separate query keeps account management available before personnel tables are activated.
  let personnel: Record<string, ReturnType<typeof personnelSummary>> = {};
  try {
    const profiles = await prisma.riderPersonnelProfile.findMany({ where: { userId: { in: accounts.map(account => account.id) } }, select: { userId: true, data: true, documents: { select: { kind: true } } } });
    const byUser = new Map(profiles.map(profile => [profile.userId, profile]));
    personnel = Object.fromEntries(accounts.map(account => [account.id, personnelSummary(account.role, byUser.get(account.id) || null)]));
  } catch { /* Unknown is displayed instead of a false 0%. */ }
  return (
    <>
      <Topbar title="Personnel" subtitle="dossiers, équipe & accès" />
      <TeamClient accounts={JSON.parse(JSON.stringify(accounts.map(account => ({ ...account, personnel: personnel[account.id] ?? null }))))} currentUser={user} />
    </>
  );
}
