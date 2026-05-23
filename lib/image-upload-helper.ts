export async function processImageFile(file: File): Promise<{ dataUrl: string; fileName: string }> {
  let processedFile = file;

  // Check if file is HEIC/HEIF
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  ) {
    try {
      const { default: heic2any } = await import("heic2any");
      const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      });

      const resultBlob = Array.isArray(blob) ? blob[0] : blob;
      const newName = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
      
      processedFile = new File([resultBlob], newName, { type: "image/jpeg" });
    } catch {
      throw new Error("Impossible de convertir l'image HEIC. Veuillez utiliser une image JPG ou PNG.");
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        dataUrl: reader.result as string,
        fileName: processedFile.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(processedFile);
  });
}
