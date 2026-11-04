export type LocalLearningItem = {
  title: string;
  href: string;
  requiresPro?: boolean;
  done: boolean;
  revise: boolean;
  marked: boolean;
  note: string;
};

export function localLearningPrefix(user: string) {
  return `fast-sprint:learning:${user}:`;
}

export function readLocalLearningItem(key: string): LocalLearningItem | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const item: LocalLearningItem = JSON.parse(raw);
  if (!item || typeof item.title !== "string" || typeof item.href !== "string" ||
      !/^\/(dsa|core|resources)(?:\/|\?|#|$)/.test(item.href) ||
      typeof item.done !== "boolean" || typeof item.revise !== "boolean" ||
      typeof item.marked !== "boolean" || typeof item.note !== "string") return null;
  return item;
}
