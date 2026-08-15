"use client";
import { useStore } from "@/components/StoreProvider";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useEffect, useState } from "react";
import type { Product } from "@/types/store";

export default function WishlistPage(){
 const {wishlist}=useStore(); const [products,setProducts]=useState<Product[]>([]);
 useEffect(()=>{if(!wishlist.length){setProducts([]);return;} fetch("/api/products?ids="+wishlist.join(",")).then(r=>r.json()).then(d=>setProducts(d.products||[]))},[wishlist]);
 return <div className="container page-shell"><div className="page-heading"><span className="eyebrow">SAVED</span><h1>Your wishlist</h1><p>{wishlist.length} saved item{wishlist.length===1?"":"s"}</p></div>{products.length?<div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty-state"><h3>Your wishlist is empty</h3><Link href="/products" className="btn-primary">Discover products</Link></div>}</div>;
}
