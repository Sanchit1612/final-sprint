import Link from "next/link";
import { LIBRARY } from "@/config/library";
import { PageHeader } from "@/components/ui";
export default function Page(){return <><PageHeader title="Your preparation library" subtitle="Source-backed learning collections. Review status is shown before you open a pack."/><p className="mb-5 text-sm text-muted">Learning sources are being reviewed. Source indexes are not complete question banks or verified company interview claims.</p><div className="grid gap-4 sm:grid-cols-2">{LIBRARY.map(c=><Link className="card hover-card" href={`/resources/${c.slug}`} key={c.slug}><p className="text-xs text-accent">{c.pro?"Pro":"Free"}</p><h2 className="mt-2 text-xl">{c.title}</h2><p className="mt-2 text-sm text-muted">{c.status}</p></Link>)}</div></>}
