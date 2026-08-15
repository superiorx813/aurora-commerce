"use client";

import Link from "next/link";
import { Search, ShoppingBag, Heart, UserRound, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./StoreProvider";

export default function Header() {
  const { cartCount, wishlist } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <button className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
          <Link href="/" className="brand">
            <span className="brand-mark">A</span>
            <span>AURORA</span>
          </Link>

          <form className="search-box" action="/products">
            <Search size={19}/>
            <input name="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products, brands & collections" />
            <button>Search</button>
          </form>

          <nav className="header-actions">
            <Link href="/wishlist" aria-label="Wishlist"><Heart size={20}/><span className="desktop-label">Wishlist</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</Link>
            <Link href="/account" aria-label="Account"><UserRound size={20}/><span className="desktop-label">Account</span></Link>
            <Link href="/cart" className="cart-link" aria-label="Cart"><ShoppingBag size={20}/><span className="desktop-label">Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
          </nav>
        </div>
        <div className={`mobile-nav ${open ? "show" : ""}`}>
          <Link href="/products" onClick={() => setOpen(false)}>Shop All</Link>
          <Link href="/products?category=electronics" onClick={() => setOpen(false)}>Electronics</Link>
          <Link href="/products?category=fashion" onClick={() => setOpen(false)}>Fashion</Link>
          <Link href="/products?category=home" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/products?category=beauty" onClick={() => setOpen(false)}>Beauty</Link>
        </div>
      </header>
      <div className="announcement">Free delivery above ₹999 · Easy returns · Secure checkout</div>
    </>
  );
}
