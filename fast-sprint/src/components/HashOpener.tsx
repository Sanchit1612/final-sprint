"use client";
import { useEffect } from "react";

/** Opens every collapsed section that contains the element named in the URL hash, then scrolls to it. */
export function HashOpener() {
  useEffect(() => {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    for (let p: HTMLElement | null = el; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
    el.scrollIntoView({ block: "center" });
  }, []);
  return null;
}
