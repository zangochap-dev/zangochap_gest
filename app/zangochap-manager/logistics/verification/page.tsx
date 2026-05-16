import Topbar from "@/components/Topbar";
import VerificationClient from "@/modules/logistics/verification/VerificationClient";

export default function VerificationPage() {
  return (
    <>
      <Topbar title="Fiche" subtitle="vérification logistique" />
      <VerificationClient />
    </>
  );
}
