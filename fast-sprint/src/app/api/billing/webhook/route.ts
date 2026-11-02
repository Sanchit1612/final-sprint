import { createHash } from "node:crypto";
import { z } from "zod";
import { billingConfig, signatureValid, SUPPORTED_WEBHOOKS } from "@/lib/billing/razorpay";
import { readRaw } from "@/lib/billing/server";
import { reconcileNotice } from "@/lib/billing/reconcile";
export const runtime="nodejs";
export async function POST(request: Request) {
 try {
  const config=billingConfig(),raw=await readRaw(request,262144);
  if(!signatureValid(raw,request.headers.get("x-razorpay-signature"),config.webhook))return new Response("Invalid signature",{status:400});
  const input=z.object({event:z.string(),created_at:z.number().int().nonnegative(),payload:z.object({
   payment:z.object({entity:z.object({id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),order_id:z.string().regex(/^order_[a-zA-Z0-9]+$/)})}).optional(),
   refund:z.object({entity:z.object({id:z.string().regex(/^rfnd_[a-zA-Z0-9]+$/)})}).optional(),
   dispute:z.object({entity:z.object({id:z.string().regex(/^disp_[a-zA-Z0-9]+$/)})}).optional()
  })}).parse(JSON.parse(raw.toString("utf8")));
  if(!(SUPPORTED_WEBHOOKS as readonly string[]).includes(input.event))return Response.json({ignored:true});
  if(input.event.startsWith("payment.dispute.")&&!input.payload.dispute)throw new Error("Missing dispute");
  if(input.event.startsWith("refund.")&&!input.payload.refund)throw new Error("Missing refund");
  const payment=input.payload.payment?.entity;if(!payment)throw new Error("Missing payment");
  // Bind receipt ID to signed bytes; never trust the unsigned event-ID header for deduplication.
  await reconcileNotice(payment.order_id,payment.id,`webhook:${createHash("sha256").update(raw).digest("hex")}`,config,{event:input.event,created_at:input.created_at,refundId:input.payload.refund?.entity.id,disputeId:input.payload.dispute?.entity.id});
  return Response.json({received:true});
 }catch{return new Response("Confirmation pending; retry delivery",{status:503});}
}
