import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || "";

/**
 * Upload une image sur S3 après optimisation avec Sharp
 */
export async function uploadToS3(dataUrl: string, fileName: string): Promise<string> {
  if (!BUCKET_NAME) {
    console.warn("⚠️ S3_BUCKET non configuré. Utilisation de la data URL directe (non recommandé pour la production).");
    return dataUrl; 
  }

  // 1. Extraire les données binaires
  const base64Data = dataUrl.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  // 2. OPTIMISATION AVEC SHARP
  // - On redimensionne (max 1200px)
  // - On convertit en WebP (format moderne ultra-léger)
  // - On retire les métadonnées (EXIF)
  const optimizedBuffer = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `products/${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: "image/webp",
    })
  );

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "") || `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`;
  
  if (process.env.S3_ENDPOINT) {
    return `${endpoint}/${BUCKET_NAME}/${key}`;
  }
  
  return `${endpoint}/${key}`;
}
