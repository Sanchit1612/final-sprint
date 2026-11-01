import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";
export const metadata={title:"Payment history"};
export default async function Page(){
 const {supabase,user}=await requireSession();
 const {data,error}=await supabase.from("payment_orders").select("id,months,amount,currency,status,mode,created_at,provider_payment_id").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
 return <><PageHeader title="Your payment history" subtitle="One-time passes, with server-verified receipts. Test payments do not activate real Pro access."/>{error?<p className="card text-sm text-muted">Payment history will be available after billing setup is approved and configured. Payments remain disabled until then.</p>:!data?.length?<p className="card text-muted">No checkout records yet.</p>:<div className="space-y-3">{data.map(o=><article className="card" key={o.id}><h2>{o.months}-month pass · ₹{(o.amount/100).toFixed(2)}</h2><p className="mt-2 text-sm text-muted">{o.mode.toUpperCase()} · {o.status} · {new Date(o.created_at).toLocaleDateString("en-IN")}</p><p className="mt-2 break-all text-xs text-muted">Reference: {o.provider_payment_id??o.id}</p>{o.status!=="paid"&&<p className="mt-2 text-sm text-muted">If money was deducted, contact support with this reference before paying again.</p>}</article>)}</div>}<Link href="/pricing" className="btn-ghost mt-5">View passes</Link></>;
}
