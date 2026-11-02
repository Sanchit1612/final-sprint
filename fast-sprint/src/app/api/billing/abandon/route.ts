import {z} from 'zod';
import {getSession} from '@/lib/session';
import {billingConfig} from '@/lib/billing/razorpay';
import {billingAdmin,browserOrigin,readJson} from '@/lib/billing/server';
export async function POST(request:Request){
 try{
  const config=billingConfig();browserOrigin(request,config);const s=await getSession();if(!s)return Response.json({error:'Sign in again.'},{status:401});
  const {order}=z.object({order:z.string().uuid()}).strict().parse(await readJson(request));
  const {error}=await billingAdmin().from('payment_orders').update({abandoned_at:new Date().toISOString()}).eq('id',order).eq('user_id',s.user.id).eq('mode',config.mode).is('paid_at',null);
  if(error)throw error;return Response.json({recorded:true});
 }catch{return Response.json({error:'Checkout history update unavailable.'},{status:503});}
}
