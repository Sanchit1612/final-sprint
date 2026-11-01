import { z } from "zod";
import { getSession } from "@/lib/session";
import { billingConfig, signatureValid } from "@/lib/billing/razorpay";
import { billingAdmin, browserOrigin, readJson, settlePayment } from "@/lib/billing/server";
export const runtime="nodejs";
export async function POST(request: Request) {
 try {
  const config=billingConfig();browserOrigin(request,config);
  const s=await getSession();if(!s)return Response.json({error:"Sign in again to confirm your payment."},{status:401});
  const input=z.object({order:z.string().uuid(),razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),razorpay_signature:z.string().length(64)}).strict().parse(await readJson(request));
  const {data:order,error}=await billingAdmin().from("payment_orders").select("provider_order_id").eq("id",input.order).eq("user_id",s.user.id).eq("mode",config.mode).maybeSingle();
  if(error||!order?.provider_order_id||!signatureValid(`${order.provider_order_id}|${input.razorpay_payment_id}`,input.razorpay_signature,config.secret))return Response.json({error:"Payment signature could not be verified."},{status:400});
  return Response.json(await settlePayment(order.provider_order_id,input.razorpay_payment_id,`callback:${input.razorpay_payment_id}`,config,s.user.id));
 }catch{return Response.json({error:"Payment confirmation is pending. Check payment history or contact support; do not pay again."},{status:503});}
}
