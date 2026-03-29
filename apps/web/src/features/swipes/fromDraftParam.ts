export function parseFromDraftParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (!/^[a-f0-9]{24}$/.test(trimmed)) return null;
  return trimmed;
}
