"use client";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { money } from "@/lib/utils";

export default function CartPage() {
  const {cart,cartTotal,updateQuantity,removeFromCart}=useStore();
  const shipping=cartTotal>=999||cartTotal===0?0:99;
  const total=cartTotal+shipping;
  if(!cart.length) return <div className="container empty-state page-shell"><div className="empty-icon">🛍</div><h1>Your bag is waiting</h1><p>Add something beautiful to get started.</p><Link href="/products" className="btn-primary">Start shopping</Link></div>;
  return <div className="container page-shell"><div className="page-heading"><span className="eyebrow">YOUR BAG</span><h1>Ready when you are.</h1></div>
    <div className="checkout-grid"><div className="cart-list">{cart.map(i=><div className="cart-item" key={i.id}><img src={i.image_url} alt={i.name}/><div className="cart-info"><span>{i.brand}</span><h3>{i.name}</h3><strong>{money(i.price)}</strong><div className="qty"><button onClick={()=>updateQuantity(i.id,i.quantity-1)}><Minus size={14}/></button><b>{i.quantity}</b><button onClick={()=>updateQuantity(i.id,i.quantity+1)}><Plus size={14}/></button></div></div><button className="remove" onClick={()=>removeFromCart(i.id)}><Trash2 size={18}/></button></div>)}</div>
    <aside className="summary"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(cartTotal)}</b></div><div><span>Shipping</span><b>{shipping?money(shipping):"Free"}</b></div><hr/><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><Link href="/checkout" className="btn-primary wide">Checkout <ArrowRight size={18}/></Link><small>Taxes included where applicable.</small></aside></div>
  </div>;
}
