import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Resolves the directory where media files should be stored.
 * Priority: 
 * 1. Process environment UPLOAD_DIR (useful for Docker/VPS absolute paths)
 * 2. Default project-relative public/uploads
 */
export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR;
  }
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Uploads an image locally to the uploads directory.
 * @param dataUrl Base64 data of the image
 * @param fileName Original filename
 * @returns The relative URL of the uploaded image
 */
export async function uploadImage(dataUrl: string, fileName: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return dataUrl;
  }

  try {
    const base64Data = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    
    // Optimization with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const timestamp = Date.now();
    const slugifiedName = fileName.toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/\.[^/.]+$/, ""); // Remove extension
    
    const finalFileName = `${timestamp}-${slugifiedName}.webp`;
    
    const uploadDir = getUploadDir();
    console.log(`[UPLOAD] Target directory: ${uploadDir}`);
    
    if (!fs.existsSync(uploadDir)) {
      console.log(`[UPLOAD] Creating directory: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, finalFileName);
    console.log(`[UPLOAD] Writing to: ${filePath}`);
    
    fs.writeFileSync(filePath, optimizedBuffer);
    console.log(`[UPLOAD] Success: ${finalFileName}`);

    // Return the relative URL (always served via /uploads in standard Next.js config)
    return `/uploads/${finalFileName}`;
  } catch (error: any) {
    console.error("[UPLOAD] Error:", error);
    throw new Error(`Erreur d'upload: ${error.message || "Erreur inconnue"}`);
  }
}
