"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
type Result={razorpay_payment_id:string;razorpay_signature:string};
type Checkout={open:()=>void;on:(event:string,handler:()=>void)=>void};
declare global {interface Window {Razorpay?:new(options:Record<string,unknown>)=>Checkout}}
let script:Promise<void>|undefined;
function loadCheckout(){
 if(window.Razorpay)return Promise.resolve();
 if(!script)script=new Promise((resolve,reject)=>{const el=document.createElement("script");el.src="https://checkout.razorpay.com/v1/checkout.js";el.onload=()=>resolve();el.onerror=()=>{script=undefined;el.remove();reject(new Error("Could not load checkout."));};document.head.appendChild(el);});
 return script;
}
export function CheckoutButton({months,ready,signedIn,mode,testPro=false}:{months:number;ready:boolean;signedIn:boolean;mode?:string;testPro?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");const request=useRef<string|null>(null);const router=useRouter();
 async function start(){
  if(!signedIn){router.push("/login?next=/pricing");return;}
  setBusy(true);setMessage("");request.current??=crypto.randomUUID();
  try{
   await loadCheckout();
   const response=await fetch("/api/billing/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({months,requestId:request.current})});
   const order=await response.json();if(!response.ok)throw new Error(order.error);
   if(!window.Razorpay)throw new Error("Checkout unavailable.");
   const checkout=new window.Razorpay({key:order.keyId,order_id:order.orderId,amount:order.amount,currency:order.currency,name:"Fast Sprint",description:`${months}-month Pro pass${order.mode==="test"?" — TEST ONLY":""}`,modal:{ondismiss:()=>{setBusy(false);setMessage("Checkout closed. Your preparation is saved.");void fetch("/api/billing/abandon",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order:order.id}),keepalive:true}).catch(()=>{});}},handler:async(result:Result)=>{
    try{
     const verified=await fetch("/api/billing/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order:order.id,razorpay_payment_id:result.razorpay_payment_id,razorpay_signature:result.razorpay_signature})});
     const data=await verified.json();if(!verified.ok)throw new Error(data.error);
     request.current=null;setMessage(data.mode==="test"?(data.proGranted?"Test payment verified. Staging Pro access is active.":"Test payment verified. This environment records receipts without granting Pro."):"Payment verified. Your Pro pass is active.");router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:"Confirmation pending. Check payment history before paying again.");}finally{setBusy(false);}
   }});
   checkout.on("payment.failed",()=>{setBusy(false);setMessage("Payment was not completed. Check payment history before retrying.");});checkout.open();
  }catch(e){setBusy(false);setMessage(e instanceof Error?e.message:"Checkout unavailable.");}
 }
 return <><button disabled={!ready||busy} onClick={start} className="btn-primary mt-5 w-full">{busy?"Confirming…":!ready?"Payments open after setup":mode==="test"?"Try test checkout":signedIn?"Choose Pro":"Sign in to choose Pro"}</button>{mode==="test"&&ready&&<p className="mt-2 text-xs text-muted">Test mode · no real money{testPro?" · staging Pro acceptance enabled":" · no Pro activation"}</p>}{message&&<p role="status" className="mt-3 text-sm text-muted">{message}</p>}</>;
}
