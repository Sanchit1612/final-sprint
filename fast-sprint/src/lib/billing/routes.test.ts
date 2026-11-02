import {beforeEach,expect,it,vi} from 'vitest';
const {session,admin,settle,reconcile}=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn(),settle:vi.fn(),reconcile:vi.fn()}));
vi.mock('./reconcile',()=>({reconcileNotice:reconcile}));
vi.mock('@/lib/session',()=>({getSession:session}));
vi.mock('./server',async(importOriginal)=>({...await importOriginal<typeof import('./server')>(),billingAdmin:admin,settlePayment:settle}));
import {POST as verify} from '@/app/api/billing/verify/route';
import {POST as webhook} from '@/app/api/billing/webhook/route';
import {readRaw} from './server';
import {createHmac} from 'node:crypto';
beforeEach(()=>{
 vi.clearAllMocks();
 for(const [k,v] of Object.entries({PAYMENTS_ENABLED:'true',RAZORPAY_MODE:'test',RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'api_fixture',RAZORPAY_WEBHOOK_SECRET:'webhook_fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',NEXT_PUBLIC_SITE_URL:'http://localhost:3000'}))vi.stubEnv(k,v);
});
const req=(body:unknown,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/billing/verify',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
it('rejects cross-origin verification before authentication or database access',async()=>{
 expect((await verify(req({},'https://evil.example'))).status).toBe(503);expect(session).not.toHaveBeenCalled();expect(admin).not.toHaveBeenCalled();
});
it('requires a real authenticated session for callback verification',async()=>{
 session.mockResolvedValue(null);expect((await verify(req({}))).status).toBe(401);expect(admin).not.toHaveBeenCalled();
});
it('looks up the stored order for the authenticated owner and refuses forged signatures',async()=>{
 session.mockResolvedValue({user:{id:'owner'}});
 const chain={select:vi.fn(),eq:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:{provider_order_id:'order_stored'},error:null})};chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);admin.mockReturnValue({from:()=>chain});
 const response=await verify(req({order:'11111111-1111-4111-8111-111111111111',razorpay_payment_id:'pay_fixture',razorpay_signature:'0'.repeat(64)}));
 expect(response.status).toBe(400);expect(chain.eq).toHaveBeenCalledWith('user_id','owner');expect(settle).not.toHaveBeenCalled();
 const sig=createHmac('sha256','api_fixture').update('order_stored|pay_fixture').digest('hex');settle.mockResolvedValue({confirmed:true,mode:'test',proGranted:false});
 expect((await verify(req({order:'11111111-1111-4111-8111-111111111111',razorpay_payment_id:'pay_fixture',razorpay_signature:sig}))).status).toBe(200);
 expect(settle).toHaveBeenCalledWith('order_stored','pay_fixture','callback:pay_fixture',expect.objectContaining({mode:'test'}),'owner');
});
it('verifies raw webhook bytes and ignores non-capture events without granting access',async()=>{
 const body=JSON.stringify({event:'payment.authorized',created_at:1,payload:{}});
 const request=(sig:string)=>new Request('http://localhost:3000/api/billing/webhook',{method:'POST',headers:{'x-razorpay-signature':sig},body});
 expect((await webhook(request('0'.repeat(64)))).status).toBe(400);
 const sig=createHmac('sha256','webhook_fixture').update(body).digest('hex');expect((await webhook(request(sig))).status).toBe(200);expect(settle).not.toHaveBeenCalled();
});
it('uses signed payment identity for durable webhook reconciliation and retries failures',async()=>{
 const body=JSON.stringify({event:'payment.captured',created_at:1,payload:{payment:{entity:{id:'pay_fixture',order_id:'order_stored'}}}});
 const request=()=>new Request('http://localhost:3000/api/billing/webhook',{method:'POST',headers:{'x-razorpay-signature':createHmac('sha256','webhook_fixture').update(body).digest('hex'),'x-razorpay-event-id':'untrusted-header'},body});
 reconcile.mockRejectedValueOnce(new Error('DB unavailable'));expect((await webhook(request())).status).toBe(503);
 reconcile.mockResolvedValueOnce({confirmed:true});expect((await webhook(request())).status).toBe(200);expect(reconcile).toHaveBeenLastCalledWith('order_stored','pay_fixture',expect.stringMatching(/^webhook:[a-f0-9]{64}$/),expect.anything(),expect.objectContaining({event:'payment.captured'}));
});
it('rejects oversized request bodies before parsing them',async()=>{
 await expect(readRaw(req('x'.repeat(5000)),4096)).rejects.toThrow('too large');
});
