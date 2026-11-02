import Image from "next/image";
import logo from "../../logo.png";
import Link from "next/link";

export function Logo({}: { href?: string }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <Image src={logo} alt="" width={32} height={32} className="rounded-lg" sizes="32px"/>
      Fast Sprint
    </Link>
  );
}
