import { z } from "zod";
import { billingConfig, disputeSchema, paymentSchema, razorpay, type Payment } from "./razorpay";
import { billingAdmin } from "./server";
export type ProviderNotice={event:string;created_at:number;refundId?:string;disputeId?:string};
const refundSchema=z.object({id:z.string().regex(/^rfnd_[a-zA-Z0-9]+$/),payment_id:z.string(),currency:z.string(),amount:z.number().int().nonnegative(),status:z.enum(["pending","processed","failed"])});
/** Count processed refunds only, including multiple partial refunds and pagination. */
export async function processedRefunds(payment:Payment,config:ReturnType<typeof billingConfig>) {
 let total=0;const ids=new Set<string>();
 for(let page=0;page<20;page++){
  const data=z.object({items:z.array(refundSchema)}).parse(await razorpay(`payments/${payment.id}/refunds?count=100&skip=${page*100}`,config));
  for(const r of data.items){if(r.payment_id!==payment.id||r.currency!==payment.currency)throw new Error("Refund ownership mismatch.");if(!ids.has(r.id)&&r.status==="processed")total+=r.amount;ids.add(r.id);}
  if(data.items.length<100){if(total>payment.amount)throw new Error("Invalid refunded total.");return total;}
 }
 throw new Error("Refund history requires operator reconciliation.");
}
/** Re-fetch current provider state; do not trust a stale webhook's financial values. */
export async function reconcileNotice(providerOrder:string,paymentId:string,eventId:string,config:ReturnType<typeof billingConfig>,notice:ProviderNotice) {
 const db=billingAdmin();
 const {data:order,error}=await db.from("payment_orders").select("*").eq("provider_order_id",providerOrder).eq("mode",config.mode).maybeSingle();
 if(error||!order)throw new Error("Order unavailable for reconciliation.");
 const payment=paymentSchema.parse(await razorpay(`payments/${paymentId}`,config));
 if(payment.id!==paymentId||payment.order_id!==providerOrder||payment.amount!==order.amount||payment.currency!==order.currency)throw new Error("Payment ownership/amount mismatch.");
 if(!payment.captured||!["captured","refunded"].includes(payment.status)){
  const result=await db.rpc("record_payment_attempt",{p_order:order.id,p_payment:paymentId,p_event:eventId,p_failed:payment.status==="failed"});
  if(result.error)throw new Error("Attempt confirmation pending.");
  return {confirmed:false,mode:config.mode,proGranted:false};
 }
 const refunded=payment.amount_refunded>0||notice.event.startsWith("refund.")?await processedRefunds(payment,config):0;
 let dispute:z.infer<typeof disputeSchema>|null=null;
 if(notice.disputeId){dispute=disputeSchema.parse(await razorpay(`disputes/${notice.disputeId}`,config));if(dispute.id!==notice.disputeId||dispute.payment_id!==paymentId||dispute.currency!==order.currency)throw new Error("Dispute ownership mismatch.");}
 const result=await db.rpc("process_payment",{p_order:order.id,p_payment:paymentId,p_event:eventId,p_mode:config.mode,p_amount:payment.amount,p_currency:payment.currency,p_refunded:refunded,p_dispute:dispute?.id??null,p_dispute_status:dispute?.status??null,p_event_time:notice.created_at,p_test_pro:config.testPro});
 if(result.error)throw new Error("Reconciliation pending.");
 return {confirmed:true,mode:config.mode,proGranted:result.data?.proGranted===true};
}
