"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureAuth } from "@/lib/auth";
import { emptyPersonnel, PersonnelSchema, isPersonnelRole, personnelRoles, riderFields } from "./types";

export async function getRiderPersonnel(userId: string) {
  const actor = await ensureAuth(["admin"]);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, phone: true, phone2: true } });
  if (!user || !isPersonnelRole(user.role) || (user.role === "DEVELOPER" && actor.role !== "developer")) throw new Error("Membre du personnel introuvable.");
  const profile = await prisma.riderPersonnelProfile.findUnique({ where: { userId }, select: {
    data: true, version: true, updatedAt: true,
    documents: { select: { id: true, kind: true, mimeType: true, createdAt: true }, orderBy: { createdAt: "desc" } },
  } });
  const saved = profile && PersonnelSchema.safeParse(profile.data);
  if (profile && !saved?.success) throw new Error("La fiche enregistrée nécessite une vérification technique.");
  return {
    userId: user.id, accountName: user.name, role: user.role,
    data: saved && saved.success ? saved.data : { ...emptyPersonnel(), phone: user.phone || "", phone2: user.phone2 || "", job: personnelRoles[user.role] },
    version: profile?.version ?? 0,
    updatedAt: profile?.updatedAt.toISOString() ?? null,
    documents: profile?.documents.map(doc => ({ ...doc, createdAt: doc.createdAt.toISOString() })) ?? [],
  };
}

export async function saveRiderPersonnel(userId: string, input: unknown, version: number) {
  try {
    const actor = await ensureAuth(["admin"]);
    const parsed = PersonnelSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
    if (!z.number().int().min(0).safeParse(version).success) return { success: false as const, error: "Version invalide. Rechargez la fiche." };
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || !isPersonnelRole(user.role) || (user.role === "DEVELOPER" && actor.role !== "developer")) return { success: false as const, error: "Membre du personnel introuvable ou accès non autorisé." };
      if (user.role !== "LIVREUR") {
        const existing = await tx.riderPersonnelProfile.findUnique({ where: { userId }, select: { data: true } });
        const previous = existing ? PersonnelSchema.safeParse(existing.data) : null;
        if (existing && !previous?.success) return { success: false as const, error: "La fiche nécessite une vérification technique." };
        for (const key of riderFields) parsed.data[key] = previous?.success ? previous.data[key] : "";
      }
      const data = { data: parsed.data, matricule: parsed.data.matricule || null, updatedBy: actor.id };
      if (version === 0) {
        await tx.riderPersonnelProfile.create({ data: { ...data, userId } });
      } else {
        const updated = await tx.riderPersonnelProfile.updateMany({ where: { userId, version }, data: { ...data, version: { increment: 1 } } });
        if (!updated.count) return { success: false as const, error: "Cette fiche a été modifiée par une autre personne. Rechargez-la avant de continuer." };
      }
      return { success: true as const, version: version + 1 };
    });
    if (result.success) {
      try { revalidatePath(`/zangochap-manager/admin/settings/team/${userId}`); } catch { /* The write is already committed. */ }
    }
    return result;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? error.code : "";
    if (code === "P2002") return { success: false as const, error: "Ce matricule est déjà utilisé ou la fiche vient d’être créée ailleurs. Vérifiez le matricule et rechargez la fiche." };
    return { success: false as const, error: "Enregistrement impossible. Vérifiez votre accès administrateur et la disponibilité du service." };
  }
}
