import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import DirectoryClient from "./DirectoryClient";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch all staff members (not CUSTOMER)
  const users = await prisma.user.findMany({
    where: {
      role: { not: "CUSTOMER" }
    },
    select: {
      id: true,
      name: true,
      phone: true,
      phone2: true,
      serviceLabel: true,
      role: true,
      email: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <>
      <Topbar title="Répertoire" subtitle="Équipe Zangochap" />
      <DirectoryClient users={JSON.parse(JSON.stringify(users))} />
    </>
  );
}
