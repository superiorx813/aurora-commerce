"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types/store";
import { discountPercent, money } from "@/lib/utils";
import { useStore } from "./StoreProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const liked = wishlist.includes(product.id);

  return (
    <motion.article className="product-card" whileHover={{ y: -6 }} transition={{ duration: .2 }}>
      <div className="product-image-wrap">
        <Link href={`/products/${product.slug}`}>
          <img src={product.image_url} alt={product.name} className="product-image"/>
        </Link>
        <button className={`heart-btn ${liked ? "liked" : ""}`} onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={liked ? "currentColor" : "none"}/></button>
        {product.stock < 10 && <span className="stock-pill">Low stock</span>}
      </div>
      <div className="product-body">
        <div className="product-brand">{product.brand}</div>
        <Link href={`/products/${product.slug}`} className="product-title">{product.name}</Link>
        <div className="rating">
  <span>{Number(product.rating).toFixed(1)} ★</span>
  <small>{Number(product.review_count) || 0} reviews</small>
</div>
        <div className="price-row"><strong>{money(product.price)}</strong><del>{money(product.mrp)}</del><em>{discountPercent(Number(product.price), Number(product.mrp))}% off</em></div>
        <button className="add-btn" onClick={() => addToCart(product)}><ShoppingBag size={17}/> Add to bag</button>
      </div>
    </motion.article>
  );
}
