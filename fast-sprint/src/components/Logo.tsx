import Image from "next/image";
import logo from "../../logo.png";
import Link from "next/link";

export function Logo({}: { href?: string }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl"><Image src={logo} alt="" fill className="scale-[2.5] object-cover" sizes="100px"/></span>
      Fast Sprint
    </Link>
  );
}
