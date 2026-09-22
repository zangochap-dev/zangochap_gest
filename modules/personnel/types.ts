import { z } from "zod";

export const sections = [
  { title: "Identification", fields: [
    ["matricule", "Matricule interne"], ["lastName", "Nom"], ["firstName", "Prénom"],
    ["sex", "Sexe", "select", "", "Masculin", "Féminin"], ["birthDate", "Date de naissance", "date"],
    ["birthPlace", "Lieu de naissance"], ["nationality", "Nationalité"],
  ] },
  { title: "Coordonnées et adresse", fields: [
    ["phone", "Téléphone principal", "tel"], ["phone2", "Téléphone secondaire", "tel"],
    ["commune", "Commune"], ["district", "Quartier"], ["address", "Adresse détaillée"],
    ["landmark", "Point de repère"], ["addressSeniority", "Ancienneté à l’adresse (ex. 2 ans)"],
  ] },
  { title: "Personne à contacter / proche", fields: [
    ["contactName", "Nom et prénom"], ["contactRelationship", "Lien avec le membre du personnel"],
    ["contactPhone", "Téléphone principal", "tel"], ["contactPhone2", "Téléphone secondaire", "tel"],
    ["contactCommune", "Commune"], ["contactDistrict", "Quartier"], ["contactLandmark", "Point de repère"],
  ] },
  { title: "Pièces d’identité et justificatifs", fields: [
    ["identityType", "Type de pièce d’identité"], ["identityNumber", "Numéro de la pièce"],
    ["identityIssued", "Date de délivrance", "date"], ["identityExpires", "Date d’expiration", "date"],
    ["licenseNumber", "Numéro du permis (si applicable)"], ["licenseExpires", "Expiration du permis", "date"],
    ["registrationNumber", "Numéro de carte grise (si applicable)"],
    ["insuranceNumber", "Numéro / police d’assurance (si applicable)"], ["insuranceExpires", "Expiration de l’assurance", "date"],
  ] },
  { title: "Informations professionnelles", fields: [
    ["job", "Fonction"], ["startDate", "Date d’entrée", "date"], ["assignmentZone", "Zone d’affectation"],
    ["supervisor", "Responsable"], ["status", "Statut administratif", "select", "", "Actif", "Suspendu", "Parti"],
    ["departureDate", "Date de départ (si applicable)", "date"], ["departureReason", "Motif de départ (si applicable)"],
  ] },
  { title: "Moyen de déplacement", fields: [
    ["vehicleType", "Type", "select", "", "Moto", "Voiture", "Vélo", "Autre"],
    ["vehicleBrand", "Marque"], ["vehicleModel", "Modèle"], ["vehicleColor", "Couleur"], ["vehiclePlate", "Immatriculation"],
  ] },
] as const;

export const documentKinds = { portrait: "Photo récente", identity: "Pièce d’identité", license: "Permis de conduire", registration: "Carte grise", insurance: "Assurance", vehicle: "Photo du véhicule" } as const;
export const DocumentKindSchema = z.enum(["portrait", "identity", "license", "registration", "insurance", "vehicle"]);
export type DocumentKind = z.infer<typeof DocumentKindSchema>;
export type PersonnelData = Record<string, string>;
const shape: Record<string, z.ZodType<string>> = {};
for (const section of sections) for (const field of section.fields) {
  const [key, label] = field;
  const type = field.length > 2 ? field[2] : "text";
  let schema: z.ZodType<string> = z.string().trim().max(500, `${label} : maximum 500 caractères.`);
  if (type === "date") schema = z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), `${label} : date invalide.`);
  if (type === "tel") schema = z.string().trim().refine(value => !value || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 8 && value.length <= 30), `${label} : numéro invalide.`);
  if (type === "select") schema = z.enum(field.slice(3) as [string, ...string[]]);
  shape[key] = schema;
}
export const PersonnelSchema = z.object(shape).strict().superRefine((data, ctx) => {
  const issue = (key: string, message: string) => ctx.addIssue({ code: "custom", path: [key], message });
  if (!data.lastName) issue("lastName", "Le nom est obligatoire.");
  if (!data.firstName) issue("firstName", "Le prénom est obligatoire.");
  if (data.birthDate && data.birthDate > new Date().toISOString().slice(0, 10)) issue("birthDate", "La date de naissance ne peut pas être dans le futur.");
  if (data.identityIssued && data.identityExpires && data.identityExpires < data.identityIssued) issue("identityExpires", "L’expiration doit suivre la délivrance.");
  if (data.startDate && data.departureDate && data.departureDate < data.startDate) issue("departureDate", "Le départ doit suivre la date d’entrée.");
  if (data.status === "Parti" && !data.departureDate) issue("departureDate", "Renseignez la date de départ.");
});
export function emptyPersonnel(): PersonnelData {
  return Object.fromEntries(sections.flatMap(section => section.fields.map(([key]) => [key, ""])));
}

export function personnelCompletion(data: PersonnelData, documents: { kind: string }[], role = "LIVREUR") {
  const excluded = new Set(["phone2", "contactPhone2"]);
  if (data.status !== "Parti") { excluded.add("departureDate"); excluded.add("departureReason"); }
  const motorized = ["Moto", "Voiture"].includes(data.vehicleType);
  const conditional = ["licenseNumber", "licenseExpires", "registrationNumber", "insuranceNumber", "insuranceExpires", "vehiclePlate"];
  if (!motorized) conditional.forEach(key => { if (!data[key]?.trim()) excluded.add(key); });
  const validation = PersonnelSchema.safeParse(data);
  const invalid = new Set(validation.success ? [] : validation.error.issues.map(issue => String(issue.path[0])));
  const entries: { label: string; done: boolean }[] = personnelSections(role).flatMap(section => section.fields
    .filter(([key]) => !excluded.has(key))
    .map(([key, label]) => ({ label, done: Boolean(data[key]?.trim()) && !invalid.has(key) })));
  const present = new Set(documents.map(document => document.kind));
  const kinds: DocumentKind[] = ["portrait", "identity"];
  if (role === "LIVREUR" && (motorized || data.licenseNumber?.trim())) kinds.push("license");
  if (role === "LIVREUR" && (motorized || data.registrationNumber?.trim())) kinds.push("registration");
  if (role === "LIVREUR" && (motorized || data.insuranceNumber?.trim())) kinds.push("insurance");
  for (const kind of kinds) entries.push({ label: documentKinds[kind], done: present.has(kind) });
  const filled = entries.filter(entry => entry.done).length;
  return { filled, total: entries.length, percent: Math.floor(filled * 100 / entries.length), missing: entries.filter(entry => !entry.done).map(entry => entry.label) };
}

export const personnelRoles: Record<string, string> = { DEVELOPER: "Développeur", ADMIN: "Administrateur", COMPTABLE: "Comptable", COMMERCIAL: "Commercial", PACKING: "Préparation", COLLECTION: "Collecte", STOCK: "Stock", POINT_RELAIS: "Point relais", LIVREUR: "Livreur" };
export function isPersonnelRole(role: string | undefined): boolean { return Boolean(role && Object.hasOwn(personnelRoles, role)); }
export const riderFields = new Set(["licenseNumber", "licenseExpires", "registrationNumber", "insuranceNumber", "insuranceExpires", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleColor", "vehiclePlate"]);
export function personnelSections(role: string) {
  return sections.map(section => ({ ...section, fields: section.fields.filter(([key]) => role === "LIVREUR" || !riderFields.has(key)) })).filter(section => section.fields.length);
}
export function allowedPersonnelDocument(role: string, kind: string) { return role === "LIVREUR" || ["portrait", "identity"].includes(kind); }
