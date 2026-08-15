"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { money } from "@/lib/utils";

export default function CheckoutPage() {
  const {cart,cartTotal}=useStore(); const router=useRouter();
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [form,setForm]=useState({fullName:"",phone:"",line1:"",line2:"",city:"",state:"",postalCode:"",paymentMethod:"DEMO"});
  const set=(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setError("");
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,address:form,paymentMethod:form.paymentMethod})});
    const d=await r.json(); if(!r.ok){setError(d.error||"Unable to place order");setLoading(false);return;} localStorage.removeItem("aurora_cart"); router.push(`/orders/${d.orderNumber}`);
  };
  if(!cart.length) return <div className="container empty-state page-shell"><h2>Your cart is empty.</h2></div>;
  return <div className="container page-shell"><div className="page-heading"><span className="eyebrow">SECURE CHECKOUT</span><h1>Almost there.</h1></div>
    <form onSubmit={submit} className="checkout-grid"><div className="checkout-form"><h3>Delivery details</h3><div className="form-grid">
      {["fullName","phone","line1","line2","city","state","postalCode"].map(n=><input key={n} required={n!=="line2"} name={n} placeholder={n==="fullName"?"Full name":n==="line1"?"Address line 1":n==="line2"?"Apartment / landmark":n==="postalCode"?"PIN code":n[0].toUpperCase()+n.slice(1)} value={(form as any)[n]} onChange={set}/>)}
    </div><h3 className="payment-title">Payment</h3><select name="paymentMethod" value={form.paymentMethod} onChange={set}><option value="DEMO">Demo payment</option><option value="COD">Cash on delivery</option><option value="UPI">UPI</option><option value="CARD">Card</option></select>{error&&<p className="error">{error}</p>}</div>
    <aside className="summary"><h3>Order summary</h3><div><span>Items</span><b>{money(cartTotal)}</b></div><div><span>Delivery</span><b>{cartTotal>=999?"Free":money(99)}</b></div><hr/><div className="summary-total"><span>Total</span><strong>{money(cartTotal+(cartTotal>=999?0:99))}</strong></div><button disabled={loading} className="btn-primary wide">{loading?"Placing order…":"Place order"}</button></aside></form>
  </div>;
}
