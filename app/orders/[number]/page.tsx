import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { money } from "@/lib/utils";
import Link from "next/link";

export const dynamic="force-dynamic";

export default async function OrderDetail({params}:{params:Promise<{number:string}>}){
 const user=await getSession(); if(!user)return <div className="container page-shell empty-state"><h2>Please sign in.</h2><Link className="btn-primary" href="/account">Sign in</Link></div>;
 const {number}=await params;
 const [orders]=await db.query("SELECT * FROM orders WHERE order_number=? AND user_id=? LIMIT 1",[number,user.id]); const o=(orders as any[])[0]; if(!o)notFound();
 const [items]=await db.query("SELECT * FROM order_items WHERE order_id=?",[o.id]);
 return <div className="container page-shell"><div className="order-success"><span>✓</span><div><span className="eyebrow">ORDER CONFIRMED</span><h1>{o.order_number}</h1><p>Thanks, {user.name}. Your order is now being prepared.</p></div></div><div className="checkout-grid"><div className="cart-list">{(items as any[]).map(i=><div className="cart-item" key={i.id}><img src={i.image_url} alt={i.product_name}/><div className="cart-info"><h3>{i.product_name}</h3><span>Qty {i.quantity}</span><strong>{money(i.unit_price)}</strong></div></div>)}</div><aside className="summary"><h3>Status</h3><div className="status-chip">{o.status.replaceAll("_"," ")}</div><div><span>Subtotal</span><b>{money(o.subtotal)}</b></div><div><span>Shipping</span><b>{o.shipping?money(o.shipping):"Free"}</b></div><hr/><div className="summary-total"><span>Total</span><strong>{money(o.total)}</strong></div></aside></div></div>;
}
