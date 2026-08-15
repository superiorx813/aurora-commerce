import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ProductActions from "@/components/ProductActions";
import { money, discountPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const [rows] = await db.query(`
    SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? LIMIT 1
  `, [slug]);
  const product = (rows as any[])[0];
  if (!product) notFound();

  const [related] = await db.query(`
    SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE p.category_id=? AND p.id<>? LIMIT 4
  `, [product.category_id, product.id]);

  return <div className="container page-shell">
    <div className="breadcrumbs">Home / {product.category_name} / {product.name}</div>
    <section className="detail-grid">
      <div className="detail-image"><img src={product.image_url} alt={product.name}/></div>
      <div className="detail-copy">
        <span className="eyebrow">{product.brand}</span><h1>{product.name}</h1>
        <div className="rating large"><span>{Number(product.rating).toFixed(1)} ★</span><small>{product.review_count || 0} reviews</small></div>
        <p className="detail-desc">{product.description}</p>
        <div className="detail-price"><strong>{money(product.price)}</strong><del>{money(product.mrp)}</del><em>{discountPercent(Number(product.price),Number(product.mrp))}% off</em></div>
        <div className="delivery-box"><b>✓ Free delivery</b><span>Usually dispatched within 24 hours</span></div>
        <ProductActions product={product}/>
        <div className="feature-list"><span>✓ 7-day easy returns</span><span>✓ Secure payments</span><span>✓ Genuine products</span></div>
      </div>
    </section>
    <section className="section"><div className="section-head"><div><span className="eyebrow">YOU MAY ALSO LIKE</span><h2>More from this collection</h2></div></div><div className="product-grid">{(related as any[]).map(p => <ProductCard key={p.id} product={p}/>)}</div></section>
  </div>;
}
