import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import { assertCaptured, billingConfig, paymentSchema, razorpay } from "./razorpay";
export function billingAdmin() {
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error("Billing database is not configured.");
  return createClient(SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function browserOrigin(request: Request, config: ReturnType<typeof billingConfig>) {
  if(request.headers.get("origin")!==config.origin)throw new Error("Invalid request origin.");
}
export async function readRaw(request: Request, limit: number) {
 const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);
 const chunks:Uint8Array[]=[];let size=0;
 try {
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error("Request is too large.");}chunks.push(value);}
 }finally{reader.releaseLock();}
 return Buffer.concat(chunks);
}
export async function readJson(request: Request, limit=4096) {
 return JSON.parse((await readRaw(request,limit)).toString("utf8"));
}
/** Both callback and webhook reconcile against the provider, then use one atomic database settlement. */
export async function settlePayment(providerOrder: string, paymentId: string, event: string, config: ReturnType<typeof billingConfig>, userId?: string) {
 const db=billingAdmin();
 const {data:order,error}=await db.from("payment_orders").select("*").eq("provider_order_id",providerOrder).eq("mode",config.mode).maybeSingle();
 if(error||!order||userId&&order.user_id!==userId)throw new Error("Order unavailable.");
 const payment=paymentSchema.parse(await razorpay(`payments/${encodeURIComponent(paymentId)}`,config));
 if(payment.id!==paymentId)throw new Error("Payment identifier mismatch.");
 assertCaptured(payment,order);
 const result=await db.rpc("settle_payment",{p_order:order.id,p_payment:payment.id,p_event:event,p_mode:config.mode,p_amount:payment.amount,p_currency:payment.currency});
 if(result.error)throw new Error("Payment confirmation is pending. Your payment can be reconciled safely by webhook or retry.");
 return {confirmed:true,mode:config.mode,proGranted:config.mode==="live"};
}
export async function billingAvailability() {
 try {
  const config=billingConfig();
  const {error}=await billingAdmin().from("payment_orders").select("id").limit(1);
  return {ready:!error,mode:config.mode};
 }catch{return {ready:false,mode:undefined};}
}
