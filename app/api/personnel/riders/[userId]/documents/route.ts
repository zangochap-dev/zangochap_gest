import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import prisma from "@/lib/prisma";
import { DocumentKindSchema, isPersonnelRole, allowedPersonnelDocument } from "@/modules/personnel/types";
import { MAX_PERSONNEL_FILE_BYTES, preparePersonnelFile } from "@/modules/personnel/files";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "developer"].includes(session.role)) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403, headers });
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && new URL(origin).host === request.headers.get("host")); } catch { /* Invalid origin fails closed. */ }
  if (!sameOrigin) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403, headers });
  const lengthHeader = request.headers.get("content-length");
  const length = Number(lengthHeader);
  if (lengthHeader !== null && (!Number.isFinite(length) || length <= 0 || length > MAX_PERSONNEL_FILE_BYTES + 64_000)) return NextResponse.json({ error: "Fichier trop volumineux (5 Mo maximum)." }, { status: 413, headers });
  try {
    const { userId } = await context.params;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !isPersonnelRole(user.role) || (user.role === "DEVELOPER" && session.role !== "developer")) return NextResponse.json({ error: "Membre du personnel introuvable." }, { status: 404, headers });
    const profile = await prisma.riderPersonnelProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "Enregistrez d’abord la fiche." }, { status: 409, headers });
    // Enforce the actual streamed size, not only the client-supplied length.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Fichier manquant." }, { status: 400, headers });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PERSONNEL_FILE_BYTES + 64_000) {
        await reader.cancel();
        return NextResponse.json({ error: "Fichier trop volumineux (5 Mo maximum)." }, { status: 413, headers });
      }
      chunks.push(value);
    }
    const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") || "" }, body: Buffer.concat(chunks) }).formData();
    const kind = DocumentKindSchema.safeParse(form.get("kind"));
    const file = form.get("file");
    if (!kind.success || !(file instanceof File)) return NextResponse.json({ error: "Document invalide." }, { status: 400, headers });
    if (!allowedPersonnelDocument(user.role, kind.data)) return NextResponse.json({ error: "Ce justificatif est réservé aux livreurs." }, { status: 400, headers });
    let prepared;
    try { prepared = await preparePersonnelFile(new Uint8Array(await file.arrayBuffer()), file.type, ["portrait", "vehicle"].includes(kind.data)); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Fichier invalide." }, { status: 400, headers }); }
    const document = await prisma.riderPersonnelDocument.create({ data: { profileId: profile.id, kind: kind.data, mimeType: prepared.mimeType, content: new Uint8Array(prepared.content), uploadedBy: session.id }, select: { id: true, kind: true, mimeType: true, createdAt: true } });
    return NextResponse.json({ document }, { headers });
  } catch { return NextResponse.json({ error: "Envoi impossible. Réessayez ultérieurement." }, { status: 503, headers }); }
}
