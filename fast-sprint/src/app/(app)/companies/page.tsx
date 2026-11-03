import Link from 'next/link';
import {requireSession} from '@/lib/session';
import {companyFacts} from '@/lib/content/company-facts';
import {companySheet,companyIndex} from '@/lib/content/companies';
import {ProPreview} from '@/components/ProPreview';
import {PageHeader} from '@/components/ui';
import {loadCompanyProgress,companyTrackingEnabled} from '@/lib/company-progress';
import {companySummaries} from '@/lib/content/company-summary';
import {ProgressBar} from '@/components/ui';
import {CompanyLogo} from '@/components/CompanyLogo';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {isPro,supabase,user}=await requireSession();if(!isPro)return <ProPreview title="Company-wise DSA sheets" headings={['Company-focused practice','Frequency-ordered problem sheets','Non-Premium LeetCode destinations']} description="Explore company-focused practice sheets, prioritise frequently reported problems and organise your next interview preparation."/>;
 const summaries=new Map(companySummaries(await loadCompanyProgress(supabase,user.id)).map(s=>[s.slug,s]));
 const {q=''}=await searchParams,companies=companyIndex().filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
 return <><PageHeader title="Company-wise DSA sheets" subtitle="Choose a company. Practise its frequency-ordered problems without leaving your preparation library."/><p className="mb-5 text-sm text-muted">Community-sourced company tags; not official employer sheets or guarantees. Only questions marked non-Premium by LeetCode at our latest check are included. Access can change.</p><form className="mb-6"><label htmlFor="company-search" className="sr-only">Search companies</label><input className="input max-w-xl" id="company-search" name="q" placeholder="Search companies…" defaultValue={q}/><button className="btn-ghost ml-2">Search</button></form><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{companies.map(c=>{const sheet=companySheet(c.slug),facts=sheet?companyFacts(sheet):null;return <Link prefetch={false} href={`/companies/${c.slug}`} key={c.slug} className="card hover-card"><div className="flex items-center gap-3"><CompanyLogo slug={c.slug} name={c.name}/><h2 className="text-lg">{c.name}</h2></div><p className="my-4 text-sm text-muted">{facts?`${facts.difficulty.easy} Easy · ${facts.difficulty.medium} Medium · ${facts.difficulty.hard} Hard`:"Explore the question bank"}{facts&&<span className="mt-2 block capitalize">{facts.topics.map(([tag,n])=>`${tag.replace(/-/g," ")} (${n})`).join(" · ")}</span>}</p><p className="border-t border-line pt-3 text-sm text-muted">{Math.min(200,c.count)} priority questions · {Math.max(0,c.count-200)} additional →</p>{companyTrackingEnabled()&&<div className="mt-3"><p className="mb-2 text-xs text-muted">{summaries.get(c.slug)?.completed??0}/{Math.min(200,c.count)} priority complete</p><ProgressBar value={summaries.get(c.slug)?.completed??0} total={Math.min(200,c.count)}/></div>}</Link>;})}</div>{!companies.length&&<p className="card">No matching company sheets.</p>}</>;
}
