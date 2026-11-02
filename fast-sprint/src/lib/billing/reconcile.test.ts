import {expect,it,vi,afterEach} from 'vitest';
import {processedRefunds} from './reconcile';
import {billingConfig,type Payment} from './razorpay';
vi.mock('./server',()=>({billingAdmin:vi.fn()}));
afterEach(()=>vi.unstubAllGlobals());
const config=billingConfig({PAYMENTS_ENABLED:'true',RAZORPAY_MODE:'test',RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'fixture',RAZORPAY_WEBHOOK_SECRET:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',NEXT_PUBLIC_SITE_URL:'http://localhost:3000'});
const payment:Payment={id:'pay_fixture',order_id:'order_fixture',amount:8900,currency:'INR',status:'captured',captured:true,amount_refunded:3000};
it('counts only processed refunds and rejects another payment or currency',async()=>{
 const refunds=[{id:'rfnd_a',payment_id:'pay_fixture',currency:'INR',amount:1000,status:'processed'},{id:'rfnd_b',payment_id:'pay_fixture',currency:'INR',amount:2000,status:'pending'},{id:'rfnd_c',payment_id:'pay_fixture',currency:'INR',amount:3000,status:'failed'}];
 const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({items:refunds})));vi.stubGlobal('fetch',fetch);
 expect(await processedRefunds(payment,config)).toBe(1000);expect(fetch.mock.calls[0][0]).toContain('/payments/pay_fixture/refunds?count=100&skip=0');
 fetch.mockResolvedValue(new Response(JSON.stringify({items:[{...refunds[0],payment_id:'pay_other'}]})));await expect(processedRefunds(payment,config)).rejects.toThrow('ownership');
 fetch.mockResolvedValue(new Response(JSON.stringify({items:[{...refunds[0],amount:9000}]})));await expect(processedRefunds(payment,config)).rejects.toThrow('total');
});
