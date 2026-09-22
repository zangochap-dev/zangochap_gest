import sharp from "sharp";

export const MAX_PERSONNEL_FILE_BYTES = 5 * 1024 * 1024;
export async function preparePersonnelFile(bytes: Uint8Array, mimeType: string, photoOnly: boolean) {
  if (!bytes.length || bytes.length > MAX_PERSONNEL_FILE_BYTES) throw new Error("Fichier vide ou supérieur à 5 Mo.");
  if (mimeType === "application/pdf" && !photoOnly) {
    if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new Error("PDF invalide.");
    return { content: Buffer.from(bytes), mimeType };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new Error("Choisissez une image JPG, PNG, WebP ou un PDF pour les justificatifs.");
  try {
    const content = await sharp(bytes, { limitInputPixels: 25_000_000 }).rotate().resize(2000, 2000, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    return { content, mimeType: "image/jpeg" };
  } catch { throw new Error("Image invalide ou trop grande."); }
}
