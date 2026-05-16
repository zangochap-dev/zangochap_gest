import Topbar from "@/components/Topbar";
import { VerificationClient } from "@/modules/logistics/verification";

export default function VerificationPage() {
  return (
    <>
      <Topbar title="Fiche" subtitle="vérification logistique" />
      <VerificationClient />
    </>
  );
}
