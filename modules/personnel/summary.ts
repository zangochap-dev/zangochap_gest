import { emptyPersonnel, PersonnelSchema, personnelCompletion } from "./types";
export function personnelSummary(role: string, profile: { data: unknown; documents: { kind: string }[] } | null) {
  const parsed = profile ? PersonnelSchema.safeParse(profile.data) : null;
  if (profile && !parsed?.success) return null;
  const data = parsed?.success ? parsed.data : emptyPersonnel();
  return { ...personnelCompletion(data, profile?.documents || [], role), status: data.status, matricule: data.matricule, saved: Boolean(profile) };
}
