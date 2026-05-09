"use server";

import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ensureAuth } from "../../lib/auth";
import { revalidatePath } from "next/cache";
import { uploadImage } from "../../lib/upload";

/**
 * Cloudflare R2 Client Configuration for Media Actions
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Récupère la liste des fichiers depuis Cloudflare R2.
 */
export async function getMediaFiles() {
  await ensureAuth(["admin", "stock", "commercial"]);
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
    });

    const response = await r2Client.send(command);
    
    if (!response.Contents) return [];

    const mediaFiles = response.Contents.map((file) => ({
      name: file.Key!,
      url: `${process.env.R2_PUBLIC_URL}/${file.Key}`,
      size: file.Size || 0,
      createdAt: file.LastModified || new Date(),
    }));

    // Trier par date décroissante
    return mediaFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Erreur lors de la lecture des médias R2:", error);
    return [];
  }
}

/**
 * Supprime un fichier média depuis Cloudflare R2.
 */
export async function deleteMediaFile(fileName: string) {
  await ensureAuth(["admin"]);
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);
    
    revalidatePath("/zangochap-manager/media");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur suppression média R2:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload un fichier média vers Cloudflare R2.
 */
export async function uploadMediaFile(dataUrl: string, fileName: string) {
  await ensureAuth(["admin", "stock", "commercial"]);
  
  try {
    const url = await uploadImage(dataUrl, fileName);
    revalidatePath("/zangochap-manager/media");
    return { success: true, url };
  } catch (error: any) {
    console.error("Erreur upload média R2:", error);
    return { success: false, error: error.message };
  }
}
