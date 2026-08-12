export const ROMANESQUE_VISUAL_FIELDS = [
  "holes",
  "endleaves",
  "support",
  "sewing",
  "board",
  "channels",
  "backCornered",
  "lining",
  "endband",
  "endbandTab",
  "coverStitch",
  "fastening",
];

export function resolveRomanesqueVisualState(derived = {}) {
  return Object.fromEntries(
    ROMANESQUE_VISUAL_FIELDS.map((field) => [field, derived[field]])
  );
}

export function romanModelSignature(derived = {}) {
  const visual = resolveRomanesqueVisualState(derived);
  return ROMANESQUE_VISUAL_FIELDS.map((field) => `${field}:${visual[field] ?? ""}`).join("|");
}
