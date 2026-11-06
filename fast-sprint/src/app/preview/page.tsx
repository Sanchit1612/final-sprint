import Link from 'next/link';
import {AppShell} from '@/components/AppShell';
import {PageHeader} from '@/components/ui';
const sections:Record<string,{title:string;features:string[]}>={
 analytics:{title:'Your preparation, in view',features:['Activity calendar and streaks','Pattern Explorer','Blind Spot Radar','Your next revision priorities']},
 practice:{title:'CS mock practice',features:['Choose DBMS, OS, CN, OOP or a mixed mock','Choose 10, 15 or 20 questions','Review your score and every explanation','One Free mock each day; unlimited with Pro']},
 companies:{title:'Company-wise DSA',features:['50 company sheets','Frequency-informed priority practice','A manageable checklist of up to 200 questions','Bookmarks and company preparation progress']},
 resources:{title:'Your preparation library',features:['Free CS fundamentals with topic reading','Aptitude exercises with worked answers','Technical interview answer guides','Development paths and projects']},
 core:{title:'CS fundamentals',features:['DBMS and SQL','Operating systems','Computer networks','Object-oriented programming']},
 sprint:{title:'Your daily preparation sprint',features:['Plan focused study tasks','Build an editable weekly plan','Carry missed work forward','Track completed tasks']},
 applications:{title:'Your applications',features:['Company and role','Application stage','Deadlines and notes','Your own private application history']},
 saved:{title:'Keep your preparation together',features:['Bookmarked questions','Personal notes','Revision flags','Account saves across devices']},
 'sql-practice':{title:'SQL practice',features:['20 PostgreSQL exercises','Example schema and expected output','Query scratchpad','Worked solutions']},
 'system-design':{title:'System design & LLD',features:['12 design lessons','Free roadmap and reading links','Design exercises with walkthroughs','A private completion checklist']},
 dashboard:{title:'Your daily preparation hub',features:['Pick your next DSA problem','Plan today’s sprint','Review what you missed','See your saved progress']},
};
export default async function Page({searchParams}:{searchParams:Promise<{section?:string}>}){
 const {section='/dashboard'}=await searchParams,raw=section.split('/').filter(Boolean)[0],key=raw==='try'?'practice':raw,data=sections[key]??sections.dashboard;
 const next=/^\/[a-z-]+(?:\/[a-z0-9-]+)*$/.test(section)?section:'/dashboard';const login='/login?next='+encodeURIComponent(next);
 return <AppShell name="Guest" isPro={false} guest><PageHeader title={data.title} subtitle="Explore Fast Sprint. Sign in when you’re ready to practise and save your work."/><p className="mb-5 text-sm text-accent">Public preview · no personal data is shown</p><div className="grid gap-4 sm:grid-cols-2">{data.features.map((text,i)=><Link key={text} href={login} className="card hover-card"><span className="text-xs text-muted">0{i+1}</span><h2 className="mt-3 text-lg">{text}</h2><p className="mt-4 text-sm text-accent">Sign in to use this feature →</p></Link>)}</div><div className="card mt-6"><h2 className="text-xl">Start with the Free DSA sheets</h2><p className="my-3 text-sm text-muted">Read Master 200, Striver A2Z and NeetCode 150 without an account. Sign in to track progress, save notes and bookmark problems.</p><Link href="/dsa" className="btn-primary">Explore Free DSA</Link><Link href={login} className="btn-ghost ml-2">Sign in</Link></div></AppShell>;
}
