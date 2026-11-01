import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { billingConfig, passAmount, razorpay } from "@/lib/billing/razorpay";
import { billingAdmin, browserOrigin, readJson } from "@/lib/billing/server";
export const runtime="nodejs";
export async function POST(request: Request) {
 try {
  const config=billingConfig();browserOrigin(request,config);
  const s=await getSession();if(!s)return Response.json({error:"Sign in to choose a pass."},{status:401});
  const input=z.object({months:z.union([z.literal(1),z.literal(3),z.literal(6)]),requestId:z.string().uuid()}).strict().parse(await readJson(request));
  const db=billingAdmin(), amount=passAmount(input.months);
  const {data:existing,error:lookupError}=await db.from("payment_orders").select("*").eq("user_id",s.user.id).eq("request_id",input.requestId).eq("mode",config.mode).maybeSingle();
  if(lookupError)throw new Error("Billing database awaits setup.");
  const payload=(id:string,provider:string)=>({id,orderId:provider,amount,currency:"INR",keyId:config.key,mode:config.mode});
  if(existing){if(existing.months!==input.months || existing.status!=="created" || !existing.provider_order_id)throw new Error("This checkout is already processing. Check payment history before starting another.");return Response.json(payload(existing.id,existing.provider_order_id));}
  const id=randomUUID();
  const {error:insertError}=await db.from("payment_orders").insert({id,user_id:s.user.id,request_id:input.requestId,months:input.months,amount,currency:"INR",mode:config.mode});
  if(insertError)throw new Error("Unable to start checkout. Check payment history before retrying.");
  const provider=z.object({id:z.string().regex(/^order_[a-zA-Z0-9]+$/),amount:z.number(),currency:z.literal("INR")}).parse(await razorpay("orders",config,{amount,currency:"INR",receipt:id,notes:{fast_sprint_order:id}}));
  if(provider.amount!==amount)throw new Error("Provider order amount mismatch.");
  const {error:updateError}=await db.from("payment_orders").update({provider_order_id:provider.id,status:"created"}).eq("id",id).eq("status","creating");
  if(updateError)throw new Error("Checkout setup interrupted. Please contact support before retrying.");
  return Response.json(payload(id,provider.id));
 }catch{return Response.json({error:"Checkout is unavailable or pending setup. Check payment history before retrying; contact support if money was deducted."},{status:503});}
}
