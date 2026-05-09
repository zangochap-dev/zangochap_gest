import { getSession } from "@/modules/auth/actions";

/**
 * Helper to ensure the user is authenticated and has one of the required roles.
 * @param roles Array of allowed roles (e.g., ["admin", "stock"])
 * @returns The session payload if authorized
 * @throws Error if not authenticated or not authorized
 */
export async function ensureAuth(roles?: string[]) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Non authentifié. Veuillez vous connecter.");
  }

  if (roles && !roles.includes(session.role.toLowerCase())) {
    throw new Error("Action non autorisée pour votre profil.");
  }

  return session;
}
