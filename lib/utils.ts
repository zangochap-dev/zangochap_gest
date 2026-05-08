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

  // Si c'est déjà une URL absolue (http/https)
  if (url.startsWith("http")) {
    return url;
  }

  // Si c'est déjà un chemin relatif commençant par /
  if (url.startsWith("/")) {
    return url;
  }

  // Si c'est juste un nom de fichier, on ajoute /uploads/
  return `/uploads/${url}`;
}
