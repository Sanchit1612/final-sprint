import {requireSession} from '@/lib/session';import {billingAdmin} from '@/lib/billing/server';import {assessmentsEnabled} from '@/lib/assessment/bank';import {MockPractice} from '@/components/MockPractice';import {PageHeader} from '@/components/ui';
export const metadata={title:'CS mock practice'};
export default async function Page(){const {user,isPro}=await requireSession(),enabled=assessmentsEnabled();let history:{id:string;subject:string;score:number|null;total:number;started:string}[]=[];
 if(enabled){const {data,error}=await billingAdmin().from('quiz_attempts').select('id,subject,score,started_at,questions').eq('user_id',user.id).order('started_at',{ascending:false}).limit(20);if(error)throw Error('Could not load your attempts');history=(data??[]).map(r=>({id:r.id,subject:r.subject,score:r.score,total:r.questions.length,started:r.started_at}));}
 return <><PageHeader title="CS mock practice" subtitle="Apply the concepts. Find the mistakes. Know what to revise next."/><MockPractice enabled={enabled} isPro={isPro} history={history}/></>;
}
