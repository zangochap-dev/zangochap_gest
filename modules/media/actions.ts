"use server";

import fs from "fs";
import path from "path";
import { ensureAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Récupère la liste des fichiers dans le dossier public/uploads.
 */
export async function getMediaFiles() {
  await ensureAuth(["admin", "stock"]);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  if (!fs.existsSync(uploadDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(uploadDir);
    const mediaFiles = [];

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stat = fs.lstatSync(filePath);

      // On ne prend que les fichiers (pas les dossiers comme '2026')
      if (stat.isFile()) {
        mediaFiles.push({
          name: file,
          url: `/uploads/${file}`,
          size: stat.size,
          createdAt: stat.birthtime
        });
      }
    }

    // Trier par date décroissante
    return mediaFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Erreur lors de la lecture des médias:", error);
    return [];
  }
}

/**
 * Supprime un fichier média du dossier uploads.
 */
export async function deleteMediaFile(fileName: string) {
  await ensureAuth(["admin"]);
  
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      revalidatePath("/zangochap-manager/media");
      return { success: true };
    }
    return { success: false, error: "Fichier non trouvé" };
  } catch (error: any) {
    console.error("Erreur suppression média:", error);
    throw new Error(`Impossible de supprimer le fichier: ${error.message}`);
  }
}
