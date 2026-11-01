import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm text-white">F</span>
      Fast Sprint
    </Link>
  );
}
