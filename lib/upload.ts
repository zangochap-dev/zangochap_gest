import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Cloudflare R2 Client Configuration
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
 * Uploads an image to Cloudflare R2.
 * @param dataUrl Base64 data of the image
 * @param fileName Original filename
 * @returns The public URL of the uploaded image
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
    
    // Upload to R2
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: finalFileName,
      Body: optimizedBuffer,
      ContentType: "image/webp",
    };

    console.log(`[R2_UPLOAD] Uploading to bucket: ${process.env.R2_BUCKET_NAME} as ${finalFileName}`);
    await r2Client.send(new PutObjectCommand(uploadParams));
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${finalFileName}`;
    console.log(`[R2_UPLOAD] Success: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error("[R2_UPLOAD] Error:", error);
    throw new Error(`Erreur d'upload Cloudflare R2: ${error.message || "Erreur inconnue"}`);
  }
}

// Keep the old function for local fallback if needed, but R2 is preferred now.
export function getUploadDir(): string {
  return ""; // Not needed for R2 but kept for API compatibility during transition
}
