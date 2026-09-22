import Link from "next/link";
import { getSession } from "@/modules/auth/actions";
import { getRiderPersonnel } from "@/modules/personnel/actions";
import RiderPersonnelForm from "@/modules/personnel/RiderPersonnelForm";

export const dynamic = "force-dynamic";
export default async function RiderPersonnelPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "developer"].includes(session.role)) return <div className="content">Accès administrateur requis.</div>;
  const { userId } = await params;
  let initial;
  try { initial = await getRiderPersonnel(userId); }
  catch { return <div className="content"><h1>Fiche indisponible</h1><p>Vérifiez que le compte appartient à l’équipe et que le service des fiches du personnel est activé.</p><Link href="/zangochap-manager/admin/settings/team">Retour à l’équipe</Link></div>; }
  return <RiderPersonnelForm initial={initial} />;
}
