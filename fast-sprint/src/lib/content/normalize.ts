export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Canonical form of a URL for duplicate detection (host case, www., fragments, utm_*, trailing slash). */
export function urlKey(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (k.toLowerCase().startsWith("utm_")) u.searchParams.delete(k);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "") || "";
    const qs = u.searchParams.toString();
    return `${host}${path}${qs ? `?${qs}` : ""}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function normText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function hostName(raw: string): string | null {
  try { return new URL(raw).hostname.replace(/^www\./, ""); } catch { return null; }
}
