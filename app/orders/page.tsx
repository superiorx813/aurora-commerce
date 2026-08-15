"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";

export default function OrdersPage(){
 const [orders,setOrders]=useState<any[]|null>(null);
 useEffect(()=>{fetch("/api/orders").then(r=>r.json()).then(d=>setOrders(d.orders||[]))},[]);
 if(orders===null)return <div className="container page-shell"><p>Loading orders…</p></div>;
 return <div className="container page-shell"><div className="page-heading"><span className="eyebrow">ACCOUNT</span><h1>Your orders</h1></div>{orders.length?<div className="orders-list">{orders.map(o=><Link href={`/orders/${o.order_number}`} className="order-row" key={o.id}><div><b>{o.order_number}</b><span>{new Date(o.created_at).toLocaleDateString()}</span></div><strong>{money(o.total)}</strong><em>{o.status.replaceAll("_"," ")}</em></Link>)}</div>:<div className="empty-state"><h3>No orders yet</h3><Link href="/products" className="btn-primary">Start shopping</Link></div>}</div>;
}
