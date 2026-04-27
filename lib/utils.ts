import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(price).replace("XOF", "FCFA");
}

export function formatDate(date: Date | string, pattern: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd MMM yyyy 'à' HH:mm");
}
