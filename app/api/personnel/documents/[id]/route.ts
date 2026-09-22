import { getSession } from "@/modules/auth/actions";
import { isPersonnelRole } from "@/modules/personnel/types";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" };
  const session = await getSession();
  if (!session || !["admin", "developer"].includes(session.role)) return new Response("Accès refusé", { status: 403, headers });
  try {
    const { id } = await context.params;
    const document = await prisma.riderPersonnelDocument.findUnique({ where: { id }, select: { content: true, mimeType: true, profile: { select: { user: { select: { role: true } } } } } });
    if (!document || !isPersonnelRole(document.profile.user.role) || (document.profile.user.role === "DEVELOPER" && session.role !== "developer")) return new Response("Document introuvable", { status: 404, headers });
    return new Response(new Uint8Array(document.content), { headers: { ...headers, "Content-Type": document.mimeType,
      "Content-Disposition": document.mimeType === "image/jpeg" ? 'inline; filename="document.jpg"' : 'attachment; filename="document.pdf"',
    } });
  } catch { return new Response("Document indisponible", { status: 503, headers }); }
}
