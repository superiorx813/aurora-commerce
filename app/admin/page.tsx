import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { money } from "@/lib/utils";

export const dynamic="force-dynamic";

export default async function AdminPage(){
 const user=await getSession(); if(!user)redirect("/account"); if(user.role!=="ADMIN")redirect("/");
 const [[stats],[orders],[products]]=await Promise.all([
   db.query("SELECT COUNT(*) orders_count, COALESCE(SUM(total),0) revenue FROM orders WHERE status<>'CANCELLED'"),
   db.query("SELECT o.*,u.name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 12"),
   db.query("SELECT * FROM products ORDER BY stock ASC LIMIT 12")
 ]);
 const s=(stats as any[])[0];
 return <div className="container page-shell"><div className="page-heading"><span className="eyebrow">AURORA CONTROL</span><h1>Admin dashboard</h1><p>Manage the storefront from one clean workspace.</p></div>
 <div className="stats-grid"><div><span>Orders</span><strong>{s.orders_count}</strong></div><div><span>Revenue</span><strong>{money(s.revenue)}</strong></div><div><span>Low stock</span><strong>{(products as any[]).filter(p=>p.stock<10).length}</strong></div></div>
 <div className="admin-grid"><section className="admin-panel"><h3>Recent orders</h3>{(orders as any[]).map(o=><div className="admin-row" key={o.id}><div><b>{o.order_number}</b><span>{o.name}</span></div><strong>{money(o.total)}</strong><em>{o.status}</em></div>)}</section><section className="admin-panel"><h3>Inventory watch</h3>{(products as any[]).map(p=><div className="admin-row" key={p.id}><div><b>{p.name}</b><span>{p.brand}</span></div><strong>{p.stock}</strong><em>{p.stock<10?"LOW":"OK"}</em></div>)}</section></div><Link href="/products" className="btn-ghost">View storefront →</Link></div>;
}
