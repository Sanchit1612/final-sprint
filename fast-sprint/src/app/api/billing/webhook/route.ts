import { z } from "zod";
import { billingConfig, signatureValid } from "@/lib/billing/razorpay";
import { readRaw, settlePayment } from "@/lib/billing/server";
export const runtime="nodejs";
export async function POST(request: Request) {
 try {
  const config=billingConfig();
  const raw=await readRaw(request,262144);
  if(raw.length>262144)return new Response("Payload too large",{status:413});
  if(!signatureValid(raw,request.headers.get("x-razorpay-signature"),config.webhook))return new Response("Invalid signature",{status:400});
  const input=z.object({event:z.string(),payload:z.object({payment:z.object({entity:z.object({id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),order_id:z.string().regex(/^order_[a-zA-Z0-9]+$/)})}).optional()})}).parse(JSON.parse(raw.toString("utf8")));
  if(!["payment.captured","order.paid"].includes(input.event))return Response.json({ignored:true});
  const payment=input.payload.payment?.entity;if(!payment)throw new Error("Missing payment");
  // Header is not signed; bind deduplication to the signed event/payment identity instead.
  await settlePayment(payment.order_id,payment.id,`webhook:${input.event}:${payment.id}`,config);
  return Response.json({received:true});
 }catch{return new Response("Confirmation pending; retry delivery",{status:503});}
}
