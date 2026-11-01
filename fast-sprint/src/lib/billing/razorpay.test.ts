import {createHmac} from "node:crypto";
import {expect,it} from "vitest";
import {assertCaptured,billingConfig,passAmount,signatureValid,type Payment} from "./razorpay";
const env={PAYMENTS_ENABLED:"true",RAZORPAY_MODE:"test",RAZORPAY_KEY_ID:"rzp_test_fixture",RAZORPAY_KEY_SECRET:"fixture",RAZORPAY_WEBHOOK_SECRET:"webhookfixture",SUPABASE_SERVICE_ROLE_KEY:"fixture",NEXT_PUBLIC_SITE_URL:"http://localhost:3000"};
it('fails closed by default and rejects mismatched or unapproved live credentials',()=>{
 expect(()=>billingConfig({})).toThrow();expect(billingConfig(env).mode).toBe('test');
 expect(()=>billingConfig({...env,RAZORPAY_KEY_ID:'rzp_live_fixture'})).toThrow();
 expect(()=>billingConfig({...env,RAZORPAY_MODE:'live',RAZORPAY_KEY_ID:'rzp_live_fixture'})).toThrow('Live payments are disabled');
 expect(()=>billingConfig({...env,RAZORPAY_MODE:'live',RAZORPAY_KEY_ID:'rzp_live_fixture',RAZORPAY_LIVE_ENABLED:'true'})).toThrow('HTTPS');
});
it('uses server-side fixed prices and rejects unsupported durations',()=>{
 expect([1,3,6].map(passAmount)).toEqual([8900,21900,39900]);expect(()=>passAmount(12)).toThrow();
});
it('authenticates the exact bytes, rejecting malformed signatures and altered payloads',()=>{
 const raw=Buffer.from('{"event": "payment.captured"}');const sig=createHmac('sha256','secret').update(raw).digest('hex');
 expect(signatureValid(raw,sig,'secret')).toBe(true);expect(signatureValid('{"event":"payment.captured"}',sig,'secret')).toBe(false);
 for(const s of [null,'','a'.repeat(63),'z'.repeat(64),sig+'a'])expect(signatureValid(raw,s,'secret')).toBe(false);
 expect(signatureValid(raw,sig,'wrong')).toBe(false);
});
it('accepts only the exact captured, unrefunded provider order and amount',()=>{
 const p:Payment={id:'pay_fixture',order_id:'order_fixture',amount:8900,currency:'INR',captured:true,status:'captured',amount_refunded:0};
 const order={provider_order_id:'order_fixture',amount:8900,currency:'INR'};
 expect(()=>assertCaptured(p,order)).not.toThrow();
 for(const delta of [{amount:89},{currency:'USD'},{order_id:'order_other'},{status:'authorized'},{captured:false},{amount_refunded:1}])expect(()=>assertCaptured({...p,...delta},order)).toThrow();
});
