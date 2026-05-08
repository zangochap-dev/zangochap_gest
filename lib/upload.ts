import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Upload une image localement dans le dossier public/uploads
 * Organisé par année/mois comme WordPress
 */
export async function uploadImage(dataUrl: string, fileName: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  
  // Chemin physique sur le serveur
  const uploadDir = path.join(process.cwd(), "public", "uploads", year, month);
  
  // S'assurer que le dossier existe
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Extraire les données binaires de la dataUrl
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    throw new Error("Format d'image invalide");
  }
  
  // Sécurité: Limitation de taille (10MB max pour l'image brute)
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("L'image est trop volumineuse (max 10Mo)");
  }
  
  // Optimisation avec Sharp
  // - Redimensionnement max 1200px
  // - Conversion en WebP (ultra léger)
  // - Suppression des métadonnées
  const optimizedBuffer = await sharp(buffer)
    .rotate() // Gère l'orientation automatique (EXIF)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 }) // effort: 6 pour une meilleure compression sans perte de qualité visible
    .toBuffer();
    
  // Nom de fichier propre
  const timestamp = Date.now();
  const slugifiedName = fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "") // Enlever l'extension
    .replace(/[^a-z0-9]/g, "-") // Remplacer tout ce qui n'est pas alphanum par -
    .replace(/-+/g, "-") // Éviter les doubles -
    .replace(/^-|-$/g, ""); // Enlever les - au début et à la fin

  const finalFileName = `${timestamp}-${slugifiedName}.webp`;
  const filePath = path.join(uploadDir, finalFileName);
  
  // Écriture du fichier
  await fs.writeFile(filePath, optimizedBuffer);
  
  // Retourner le chemin relatif pour l'accès public
  return `/uploads/${year}/${month}/${finalFileName}`;
}
