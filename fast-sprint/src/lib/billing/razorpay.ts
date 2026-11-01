import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PRICING } from "@/config/plans";
export type BillingMode = "test" | "live";
export function billingConfig(env: Record<string,string|undefined> = process.env) {
  const mode = env.RAZORPAY_MODE;
  if (env.PAYMENTS_ENABLED !== "true" || (mode !== "test" && mode !== "live")) throw new Error("Payments are awaiting configuration.");
  if (mode === "live" && env.RAZORPAY_LIVE_ENABLED !== "true") throw new Error("Live payments are disabled.");
  const key = env.RAZORPAY_KEY_ID, secret = env.RAZORPAY_KEY_SECRET, webhook = env.RAZORPAY_WEBHOOK_SECRET;
  if (!key?.startsWith(`rzp_${mode}_`) || !secret || !webhook || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Payment credentials are incomplete or do not match the selected mode.");
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
  if (mode === "live" && origin.protocol !== "https:") throw new Error("Live payments require HTTPS.");
  return { mode: mode as BillingMode, key, secret, webhook, origin: origin.origin };
}
export function signatureValid(message: string | Buffer, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256",secret).update(message).digest(),Buffer.from(signature,"hex"));
}
export function passAmount(months: number) {
  const plan=PRICING.find(p=>p.months===months);
  if(!plan)throw new Error("Choose a supported pass.");
  return plan.price*100;
}
export const paymentSchema=z.object({id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),order_id:z.string().regex(/^order_[a-zA-Z0-9]+$/),amount:z.number().int(),currency:z.string(),status:z.string(),captured:z.boolean(),amount_refunded:z.number().int().default(0)});
export type Payment=z.infer<typeof paymentSchema>;
export function assertCaptured(payment: Payment, order: {provider_order_id:string;amount:number;currency:string}) {
  if(payment.order_id!==order.provider_order_id || payment.amount!==order.amount || payment.currency!==order.currency || payment.status!=="captured" || !payment.captured || payment.amount_refunded!==0) throw new Error("Payment is not an exact, captured, unrefunded match for this order.");
}
export async function razorpay(path: string, config: ReturnType<typeof billingConfig>, body?: unknown) {
  const response=await fetch(`https://api.razorpay.com/v1/${path}`,{method:body?"POST":"GET",headers:{Authorization:`Basic ${Buffer.from(`${config.key}:${config.secret}`).toString("base64")}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000),cache:"no-store"});
  if(!response.ok)throw new Error("The payment provider could not confirm this request. Please retry later.");
  return response.json();
}
