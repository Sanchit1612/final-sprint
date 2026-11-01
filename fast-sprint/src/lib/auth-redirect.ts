/** Only same-origin absolute paths, including after URL normalization. */
export function safeAuthRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\r\n]/.test(raw)) return "/dashboard";
  try {
    const base = "https://fast-sprint.invalid";
    const url = new URL(raw, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/dashboard";
  } catch { return "/dashboard"; }
}
