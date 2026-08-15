"use client";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/store";
import { useStore } from "./StoreProvider";

export default function ProductActions({product}:{product:Product}) {
  const {addToCart,wishlist,toggleWishlist}=useStore();
  const liked=wishlist.includes(product.id);
  return <div className="detail-actions">
    <button className="btn-primary big" onClick={()=>addToCart(product)}><ShoppingBag/> Add to bag</button>
    <button className={`wishlist-big ${liked?"liked":""}`} onClick={()=>toggleWishlist(product.id)}><Heart fill={liked?"currentColor":"none"}/>{liked?"Saved":"Wishlist"}</button>
  </div>;
}
