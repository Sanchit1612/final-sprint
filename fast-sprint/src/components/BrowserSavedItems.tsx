"use client";

import { useEffect, useState } from "react";
import { localLearningPrefix, readLocalLearningItem, type LocalLearningItem } from "@/lib/local-learning";

export function BrowserSavedItems({ user, tab, isPro }: { user: string; isPro: boolean; tab: "bookmarks" | "notes" | "revision" }) {
  const [items, setItems] = useState<LocalLearningItem[]>([]);
  useEffect(() => {
    try {
      const prefix = localLearningPrefix(user);
      const matches = Object.keys(localStorage).filter(key => key.startsWith(prefix)).flatMap(key => {
        try {
          const item = readLocalLearningItem(key);
          if (!item || (!isPro && (item.requiresPro ||
            /^\/resources\/(aptitude|behavioural|interview|development)(?:[/?#]|$)/.test(item.href)))) return [];
          return (tab === "bookmarks" ? item.marked : tab === "notes" ? item.note.trim() : item.revise) ? [item] : [];
        } catch { return []; }
      });
      setItems(matches);
    } catch { setItems([]); }
  }, [user, tab, isPro]);
  if (!items.length) return null;
  return (
    <section className="card mb-5">
      <h2 className="font-semibold">Saved on this browser</h2>
      <ul className="mt-3 space-y-3">
        {items.map(item => (
          <li key={item.href}>
            <a className="text-accent hover:underline" href={item.href}>{item.title}</a>
            {tab === "notes" && <p className="whitespace-pre-wrap break-words text-sm text-muted">{item.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
