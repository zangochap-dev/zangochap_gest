import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Uploads an image locally to the public/uploads directory.
 * Standardizes the storage to the 'uploads' folder as requested.
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
    
    // Ensure the uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, finalFileName);
    fs.writeFileSync(filePath, optimizedBuffer);

    // Return the improved relative URL
    return `/uploads/${finalFileName}`;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Erreur lors de l'enregistrement de l'image.");
  }
}
