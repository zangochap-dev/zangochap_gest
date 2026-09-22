import { notFound } from "next/navigation";
import RiderPersonnelForm from "@/modules/personnel/RiderPersonnelForm";
import Link from "next/link";
import TeamClient from "@/app/zangochap-manager/admin/settings/team/TeamClient";
import { personnelSummary } from "@/modules/personnel/summary";
import { emptyPersonnel } from "@/modules/personnel/types";

export const dynamic = "force-dynamic";
export default async function PersonnelPreview({ searchParams }: { searchParams: Promise<{ role?: string; view?: string }> }) {
  const params = await searchParams;
  const role = params.role === "commercial" ? "COMMERCIAL" : "LIVREUR";
  if (process.env.NODE_ENV !== "development" || process.env.PERSONNEL_PREVIEW !== "1") notFound();
  return <>
    <p style={{ padding: 16, background: "#fff3cd" }}>Aperçu local — données fictives, aucun enregistrement réel. Les justificatifs sont couverts par les tests isolés.</p>
    <nav style={{ display: "flex", gap: 20, padding: "0 28px" }}><Link href="?view=team">Annuaire</Link><Link href="?role=commercial">Fiche commercial</Link><Link href="?role=livreur">Fiche livreur</Link></nav>
    {params.view === "team" ? <TeamClient preview currentUser={{ role: "admin", email: "preview@example.invalid" }} accounts={["COMMERCIAL", "LIVREUR", "ADMIN"].map((staffRole, index) => ({ id: `preview-${index}`, name: `Membre fictif ${index + 1}`, email: `membre${index + 1}@example.invalid`, role: staffRole, personnel: personnelSummary(staffRole, index === 0 ? { data: { ...emptyPersonnel(), lastName: "Exemple", firstName: "Test", job: "Commercial", status: "Actif" }, documents: [] } : null) }))} /> : <RiderPersonnelForm initial={{ userId: "preview-personnel", role, accountName: role === "LIVREUR" ? "Livreur fictif" : "Commercial fictif", data: emptyPersonnel(), version: 0, updatedAt: null, documents: [] }} />}
  </>;
}
