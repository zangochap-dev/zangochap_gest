import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    if (session.role === 'livreur') {
      redirect("/zangochap-manager/delivery");
    } else {
      redirect("/zangochap-manager/dashboard");
    }
  }

  return <LoginClient />;
}
