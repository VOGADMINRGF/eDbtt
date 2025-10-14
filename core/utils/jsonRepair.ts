export function jsonRepair<T = unknown>(src: string): T | null {
  if (typeof src !== "string") return null;
  try { return JSON.parse(src) as T; } catch {}
  try {
    const fixed = src
      // trailing commas
      .replace(/,\s*([}\]])/g, "$1")
      // Steuerzeichen entfernen
      .replace(/[\u0000-\u001F]+/g, "")
      // unquoted keys -> "key":
      .replace(/([{,]\s*)([A-Za-z_][\w-]*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(fixed) as T;
  } catch {
    return null;
  }
}
export default jsonRepair;
