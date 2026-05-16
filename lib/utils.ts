import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardise les URLs des images pour le site.
 * Gère les chemins relatifs (/uploads/...), les noms de fichiers seuls, et les URLs externes.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.png";

  // Handle multiple URLs in a single string (common in Wix exports)
  // But DO NOT split if it's a DataURL (base64)
  let cleanUrl = url;
  if (url.includes(';') && !url.startsWith('data:')) {
    cleanUrl = url.split(';')[0].trim();
  }

  // If it's already an absolute URL (http/https)
  if (cleanUrl.startsWith("http")) {
    return cleanUrl;
  }

  // If it's already a relative path starting with / or a Base64 image (data:)
  if (cleanUrl.startsWith("/") || cleanUrl.startsWith("data:")) {
    return cleanUrl;
  }

  // If it's just a filename, we add /uploads/
  return `/uploads/${cleanUrl}`;
}
