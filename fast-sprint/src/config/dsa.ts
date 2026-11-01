import { LIBRARY, isCoreRoot } from "./library";
export const DSA_COLLECTIONS = [
  { key: "master", root: "dsa-200", title: "200 Most Important Problems", description: "A focused interview path, organised by problem-solving pattern.", target: 200 },
  { key: "striver", root: "dsa-a2z", title: "Striver A2Z", description: "The original 18-step sequence, kept as its own collection.", target: 455 },
  { key: "neetcode", root: "dsa-neetcode150", title: "NeetCode 150", description: "A separate pattern-based practice collection.", target: 150 },
] as const;
export function dsaCollection(key?: string) {
  return DSA_COLLECTIONS.find(c => c.key === key) ?? DSA_COLLECTIONS[0];
}
export function isDsaRoot(slug: string) { return slug === "dsa" || DSA_COLLECTIONS.some(c => c.root === slug); }
export function learningHref(slug: string) {
  if (slug === "dsa") return "/dsa?collection=legacy";
  if (LIBRARY.some(c => c.slug === slug) && !isCoreRoot(slug)) return `/resources/${encodeURIComponent(slug)}`;
  const c = DSA_COLLECTIONS.find(c => c.root === slug);
  return c ? `/dsa?collection=${c.key}` : `/core/${encodeURIComponent(slug)}`;
}
