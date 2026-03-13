export function buildSourceAnchorPublicPath(dossierId: string, anchorId: string) {
  const safeDossierId = encodeURIComponent(dossierId);
  const safeAnchorId = encodeURIComponent(anchorId);
  return `/dossier/${safeDossierId}?anchor=${safeAnchorId}`;
}
