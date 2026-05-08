import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    if (session.role.toLowerCase() === 'livreur') {
      redirect("/zangochap-rider");
    } else {
      redirect("/zangochap-manager/dashboard");
    }
  }

  return <LoginClient />;
}
