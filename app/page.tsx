import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import CategoryRail from "@/components/CategoryRail";

export const dynamic = "force-dynamic";

async function getFeatured() {
  const [rows] = await db.query(`
    SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE p.featured=1 ORDER BY p.created_at DESC LIMIT 8
  `);
  return rows as any[];
}

export default async function Home() {
  const products = await getFeatured();
  return <>
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">THE AURORA EDIT · 2026</span>
          <h1>Shopping, with a little more <i>spark.</i></h1>
          <p>A premium marketplace for everyday essentials, statement pieces and smart finds — curated instead of crowded.</p>
          <div className="hero-buttons"><Link className="btn-primary" href="/products">Explore collection</Link><Link className="btn-ghost" href="/products?sort=featured">See trending →</Link></div>
          <div className="hero-stats"><span><b>10k+</b><small>curated finds</small></span><span><b>4.8/5</b><small>shopper rating</small></span><span><b>24h</b><small>dispatch promise</small></span></div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit orbit-1"></div><div className="hero-orbit orbit-2"></div>
          <div className="hero-card card-main"><img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000" alt="Featured camera"/></div>
          <div className="hero-card card-float"><span>01 / 06</span><strong>Objects worth<br/>keeping.</strong></div>
        </div>
      </div>
    </section>

    <CategoryRail/>

    <section className="container section">
      <div className="section-head"><div><span className="eyebrow">EDITOR'S PICKS</span><h2>Popular right now</h2></div><Link href="/products?sort=popular">Explore →</Link></div>
      <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>
    </section>

    <section className="container promo-banner">
      <div><span className="eyebrow">AURORA MEMBERS</span><h2>Unlock a better way to shop.</h2><p>Early access, member-only drops and personalised collections.</p></div>
      <Link href="/account" className="btn-primary">Join free</Link>
    </section>
  </>;
}
